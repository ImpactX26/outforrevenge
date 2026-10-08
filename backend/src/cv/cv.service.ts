import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CV } from '../database/entities/cv.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { User } from '../database/entities/user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { LocalStorageService } from '../storage/local-storage.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    @InjectRepository(CV)
    private readonly cvRepo: Repository<CV>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly storageService: LocalStorageService,
    private readonly pdfService: PdfGeneratorService,
    private readonly aiService: AiService,
  ) {}

  async generateCv(applicantId: string, templateName = 'Germany_EU_Clean', parentExecutionId?: string): Promise<CV> {
    const user = await this.userRepo.findOne({ where: { id: applicantId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepo.findOne({
      where: { userId: applicantId },
      relations: ['educations', 'employments', 'skills', 'languages'],
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Count existing CVs for versioning
    const existingCount = await this.cvRepo.count({ where: { applicantId } });
    const version = existingCount + 1;

    // Collect verified information with provenance
    const personalInfo = {
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: profile.phone || user.phone || '',
      location: profile.location || 'India',
    };

    const educationData = (profile.educations || []).map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.fieldOfStudy,
      period: edu.graduationDate ? `Class of ${edu.graduationDate.slice(0, 4)}` : 'Completed',
      grade: edu.gradeOrCgpa,
      provenance: `${edu.sourceType} (${edu.verificationStatus})`,
    }));

    const employmentData = (profile.employments || []).map((emp) => ({
      company: emp.companyName,
      role: emp.role,
      period: `${emp.startDate || ''} - ${emp.isCurrent ? 'Present' : emp.endDate || ''}`,
      responsibilities: emp.responsibilities,
      provenance: `${emp.sourceType} (${emp.verificationStatus})`,
    }));

    const skillsData = (profile.skills || []).map((sk) => ({
      name: sk.name,
      category: sk.category,
      level: sk.proficiencyLevel,
    }));

    const languagesData = (profile.languages || []).map((l) => ({
      language: l.language,
      level: l.proficiencyLevel,
      certificate: l.certificateType,
    }));

    // Call CV Agent for professional German summary and layout advice
    const prompt = `Generate a German standard CV profile summary from:
Applicant: ${personalInfo.fullName}
Goal: ${profile.currentGoal}
Education: ${JSON.stringify(educationData)}
Skills: ${JSON.stringify(skillsData)}
Languages: ${JSON.stringify(languagesData)}
Write a concise, professional 3-sentence summary in English/German highlighting key strengths.`;

    let summary = '';
    try {
      const { data } = await this.aiService.runAgentStructured<any>(
        'CV',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'CV_GENERATOR_AGENT',
      );
      summary = data?.summary || '';
    } catch (e) {
      summary = `Dedicated engineering graduate seeking a pathway in Germany. Possesses strong foundations in modern software development and progressing German language proficiency.`;
    }

    const cv = this.cvRepo.create({
      applicantId,
      title: `${user.firstName} ${user.lastName} - German CV (v${version})`,
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
    });

    const savedCv = await this.cvRepo.save(cv);

    // Auto-generate PDF and upload to storage
    await this.exportPdf(savedCv.id, applicantId);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: applicantId,
        action: 'CV_GENERATION',
        entityType: 'CV',
        entityId: savedCv.id,
        details: { version, templateName },
      }),
    );

    return this.getCvById(savedCv.id, applicantId);
  }

  async getCvs(applicantId: string): Promise<CV[]> {
    return this.cvRepo.find({
      where: { applicantId },
      order: { version: 'DESC' },
    });
  }

  async getCvById(id: string, applicantId: string): Promise<CV> {
    const cv = await this.cvRepo.findOne({ where: { id } });
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to CV');
    }
    return cv;
  }

  async updateCv(id: string, applicantId: string, updateData: Partial<CV>): Promise<CV> {
    const cv = await this.getCvById(id, applicantId);

    if (updateData.summary !== undefined) cv.summary = updateData.summary;
    if (updateData.title !== undefined) cv.title = updateData.title;
    if (updateData.templateName !== undefined) cv.templateName = updateData.templateName;
    if (updateData.personalInfo !== undefined) cv.personalInfo = updateData.personalInfo;
    if (updateData.educationData !== undefined) cv.educationData = updateData.educationData;
    if (updateData.employmentData !== undefined) cv.employmentData = updateData.employmentData;
    if (updateData.skillsData !== undefined) cv.skillsData = updateData.skillsData;
    if (updateData.languagesData !== undefined) cv.languagesData = updateData.languagesData;
    if (updateData.customSections !== undefined) cv.customSections = updateData.customSections;

    const saved = await this.cvRepo.save(cv);
    // Re-generate PDF on update
    await this.exportPdf(saved.id, applicantId);
    return this.getCvById(id, applicantId);
  }

  async improveSection(
    id: string,
    applicantId: string,
    sectionName: string,
    content: string,
  ): Promise<{ improvedContent: string; rationale: string }> {
    const cv = await this.getCvById(id, applicantId);

    const prompt = `Section: ${sectionName}
Current content:
"${content}"
Improve this section to match German professional Bewerbung (CV) standards. Return JSON with improvedContent and rationale.`;

    const { data } = await this.aiService.runAgentStructured<any>(
      'CV',
      applicantId,
      prompt,
    );

    return {
      improvedContent: data?.improvedContent || content,
      rationale: data?.rationale || 'Enhanced formatting and tone to align with German standard terminology.',
    };
  }

  async exportPdf(id: string, applicantId: string): Promise<{ pdfUrl: string; storageKey: string }> {
    const cv = await this.getCvById(id, applicantId);

    const pdfBuffer = await this.pdfService.generateCvPdfBuffer(cv);
    const filename = `CV_${cv.personalInfo.fullName.replace(/\s+/g, '_')}_v${cv.version}.pdf`;

    const uploadResult = await this.storageService.uploadFile(
      applicantId,
      'cv',
      filename,
      pdfBuffer,
      'application/pdf',
    );

    cv.storageKey = uploadResult.storageKey;
    cv.pdfUrl = uploadResult.url;
    await this.cvRepo.save(cv);

    return {
      pdfUrl: cv.pdfUrl,
      storageKey: cv.storageKey,
    };
  }

  async getPdfBuffer(id: string, applicantId: string): Promise<{ buffer: Buffer; filename: string }> {
    const cv = await this.getCvById(id, applicantId);
    if (!cv.storageKey) {
      await this.exportPdf(id, applicantId);
    }
    const buffer = await this.storageService.getFileBuffer(cv.storageKey);
    const filename = `CV_${cv.personalInfo.fullName.replace(/\s+/g, '_')}_v${cv.version}.pdf`;
    return { buffer, filename };
  }
}
