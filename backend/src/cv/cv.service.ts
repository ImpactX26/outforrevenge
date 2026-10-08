import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from '../storage/storage.interface';
import { PdfGeneratorService } from './pdf-generator.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
    private readonly pdfService: PdfGeneratorService,
    private readonly aiService: AiService,
  ) {}

  async generateCv(
    applicantId: string,
    templateName = 'Germany_EU_Clean',
    language = 'de',
    parentExecutionId?: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: applicantId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.prisma.applicantProfile.findUnique({
      where: { userId: applicantId },
      include: {
        educations: true,
        employments: true,
        skills: true,
        languages: true,
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const isEnglish = (language || '').toLowerCase().startsWith('en');

    // Count existing CVs for versioning
    const existingCount = await this.prisma.cV.count({ where: { applicantId } });
    const version = existingCount + 1;

    // Collect verified information with provenance
    const personalInfo = {
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: profile.phone || user.phone || '',
      location: profile.location || 'India',
      language: isEnglish ? 'en' : 'de',
    };

    const educationData = (profile.educations || []).map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.fieldOfStudy,
      period: edu.graduationDate ? `Class of ${edu.graduationDate.slice(0, 4)}` : 'Completed',
      grade: edu.gradeOrCgpa || undefined,
      provenance: `${edu.sourceType} (${edu.verificationStatus})`,
    }));

    const employmentData = (profile.employments || []).map((emp) => ({
      company: emp.companyName,
      role: emp.role,
      period: `${emp.startDate || ''} - ${emp.isCurrent ? 'Present' : emp.endDate || ''}`,
      responsibilities: emp.responsibilities || undefined,
      provenance: `${emp.sourceType} (${emp.verificationStatus})`,
    }));

    const skillsData = (profile.skills || []).map((sk) => ({
      name: sk.name,
      category: sk.category || undefined,
      level: sk.proficiencyLevel || undefined,
    }));

    const languagesData = (profile.languages || []).map((l) => ({
      language: l.language,
      level: l.proficiencyLevel,
      certificate: l.certificateType || undefined,
    }));

    // Call CV Agent for professional German or English summary
    const prompt = isEnglish
      ? `Generate a professional English CV executive summary for relocation to Germany from:
Applicant: ${personalInfo.fullName}
Goal: ${profile.currentGoal}
Education: ${JSON.stringify(educationData)}
Skills: ${JSON.stringify(skillsData)}
Languages: ${JSON.stringify(languagesData)}
Write a concise, professional 3-sentence summary in English highlighting qualifications and readiness for Germany.`
      : `Generate an idiomatic German standard CV profile summary (Kurzprofil auf Deutsch) from:
Applicant: ${personalInfo.fullName}
Goal: ${profile.currentGoal}
Education: ${JSON.stringify(educationData)}
Skills: ${JSON.stringify(skillsData)}
Languages: ${JSON.stringify(languagesData)}
Write a concise, professional 3-sentence summary in formal German (auf Deutsch) highlighting qualifications and readiness for Germany.`;

    let summary = '';
    try {
      const aiResponse = await this.aiService.runAgentStructured<any>(
        'CV',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'CV_GENERATOR_AGENT',
      );
      summary = aiResponse?.data?.summary || '';
    } catch (e: any) {
      summary = isEnglish
        ? `Dedicated candidate seeking a professional or academic pathway in Germany. Possesses strong foundations in technical skills and verified language competencies.`
        : `Engagierter Bewerber auf der Suche nach einem zukunftssicheren Bildungsweg in Deutschland. Fundierte Fachkenntnisse und nachgewiesene Sprachkompetenzen.`;
    }

    const title = isEnglish
      ? `${user.firstName} ${user.lastName} - English CV (v${version})`
      : `${user.firstName} ${user.lastName} - Lebenslauf DIN 5008 (v${version})`;

    const savedCv = await this.prisma.$transaction(async (tx) => {
      const newCv = await tx.cV.create({
        data: {
          applicantId,
          title,
          templateName,
          version,
          summary,
          isSummaryAiGenerated: true,
          personalInfo,
          educationData,
          employmentData,
          skillsData,
          languagesData,
          customSections: [],
          isPublished: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: applicantId,
          action: 'CV_GENERATION',
          entityType: 'CV',
          entityId: newCv.id,
          details: { version, templateName },
        },
      });

      return newCv;
    });

    // Auto-generate PDF and upload to storage
    await this.exportPdf(savedCv.id, applicantId);

    return this.getCvById(savedCv.id, applicantId);
  }

  async getCvs(applicantId: string): Promise<any[]> {
    return this.prisma.cV.findMany({
      where: { applicantId },
      orderBy: { version: 'desc' },
    });
  }

  async getCvById(id: string, applicantId: string): Promise<any> {
    const cv = await this.prisma.cV.findUnique({ where: { id } });
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to CV');
    }
    return cv;
  }

  async updateCv(id: string, applicantId: string, updateData: any): Promise<any> {
    const cv = await this.getCvById(id, applicantId);

    const dataToUpdate: any = {};
    if (updateData.summary !== undefined) dataToUpdate.summary = updateData.summary;
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.templateName !== undefined) dataToUpdate.templateName = updateData.templateName;
    if (updateData.personalInfo !== undefined) dataToUpdate.personalInfo = updateData.personalInfo;
    if (updateData.educationData !== undefined) dataToUpdate.educationData = updateData.educationData;
    if (updateData.employmentData !== undefined) dataToUpdate.employmentData = updateData.employmentData;
    if (updateData.skillsData !== undefined) dataToUpdate.skillsData = updateData.skillsData;
    if (updateData.languagesData !== undefined) dataToUpdate.languagesData = updateData.languagesData;
    if (updateData.customSections !== undefined) dataToUpdate.customSections = updateData.customSections;

    await this.prisma.cV.update({
      where: { id: cv.id },
      data: dataToUpdate,
    });

    // Re-generate PDF on update
    await this.exportPdf(cv.id, applicantId);
    return this.getCvById(id, applicantId);
  }

  async improveSection(
    id: string,
    applicantId: string,
    sectionName: string,
    content: string,
  ): Promise<{ improvedContent: string; rationale: string }> {
    await this.getCvById(id, applicantId);

    const prompt = `Section: ${sectionName}
Current content:
"${content}"
Improve this section to match German professional Bewerbung (CV) standards. Return JSON with improvedContent and rationale.`;

    const aiResponse = await this.aiService.runAgentStructured<any>(
      'CV',
      applicantId,
      prompt,
    );

    return {
      improvedContent: aiResponse?.data?.improvedContent || content,
      rationale: aiResponse?.data?.rationale || 'Enhanced formatting and tone to align with German standard terminology.',
    };
  }

  async exportPdf(id: string, applicantId: string): Promise<{ pdfUrl: string; storageKey: string }> {
    const cv = await this.getCvById(id, applicantId);

    const pdfBuffer = await this.pdfService.generateCvPdfBuffer(cv as any);
    const personalInfo = cv.personalInfo as any;
    const filename = `CV_${(personalInfo?.fullName || 'Applicant').replace(/\s+/g, '_')}_v${cv.version}.pdf`;

    const uploadResult = await this.storageService.uploadFile(
      applicantId,
      'cv',
      filename,
      pdfBuffer,
      'application/pdf',
    );

    const updated = await this.prisma.cV.update({
      where: { id: cv.id },
      data: {
        storageKey: uploadResult.storageKey,
        pdfUrl: uploadResult.url,
      },
    });

    return {
      pdfUrl: updated.pdfUrl || uploadResult.url,
      storageKey: updated.storageKey || uploadResult.storageKey,
    };
  }

  async getPdfBuffer(id: string, applicantId: string): Promise<{ buffer: Buffer; filename: string }> {
    let cv = await this.getCvById(id, applicantId);
    if (!cv.storageKey) {
      await this.exportPdf(id, applicantId);
      cv = await this.getCvById(id, applicantId);
    }
    const buffer = await this.storageService.getFileBuffer(cv.storageKey);
    const personalInfo = cv.personalInfo as any;
    const filename = `CV_${(personalInfo?.fullName || 'Applicant').replace(/\s+/g, '_')}_v${cv.version}.pdf`;
    return { buffer, filename };
  }
}
