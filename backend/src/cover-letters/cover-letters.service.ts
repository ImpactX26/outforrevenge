import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from '../storage/storage.interface';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CoverLettersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
    private readonly aiService: AiService,
  ) {}

  async generateCoverLetter(applicantId: string, opportunityId?: string, language = 'en'): Promise<any> {
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

    let opportunity: any | null = null;
    if (opportunityId) {
      opportunity = await this.prisma.opportunity.findUnique({ where: { id: opportunityId } });
    }

    const isEnglish = (language || '').toLowerCase().startsWith('en');

    const eduInfo = profile?.educations?.[0]
      ? `${profile.educations[0].degree} from ${profile.educations[0].institution}`
      : 'Degree on file';

    const prompt = isEnglish
      ? `Applicant: ${user.firstName} ${user.lastName}
Goal: ${profile?.currentGoal || 'Employment in Germany'}
Opportunity: ${opportunity ? `${opportunity.title} at ${opportunity.organization || opportunity.company} in ${opportunity.location}` : 'Professional Application in Germany'}
Education: ${eduInfo}
Skills: ${profile?.skills?.map((s) => s.name).join(', ') || 'Technical and professional competencies'}
Languages: ${profile?.languages?.map((l) => `${l.language} (${l.proficiencyLevel})`).join(', ') || 'English, German'}
Motivation: ${profile?.rawMotivation || 'Deep dedication to professional and vocational contribution in Germany.'}

Compose a professional, compelling English Cover Letter formatted for German employers and institutions. Structure with clear paragraphs:
1. Motivation & Specific Role Objective
2. Verified Qualifications & Key Achievements
3. Language Preparedness & Value Proposition for Germany
Open with "Dear Admissions Team / Hiring Manager," and close with "Sincerely,\n${user.firstName} ${user.lastName}". Do not fabricate unverified claims.`
      : `Applicant: ${user.firstName} ${user.lastName}
Ziel: ${profile?.currentGoal || 'Ausbildung / Berufst?tigkeit in Deutschland'}
Stelle: ${opportunity ? `${opportunity.title} bei ${opportunity.organization || opportunity.company} in ${opportunity.location}` : 'Bewerbung f?r Ausbildung / Studium / Berufseinstieg'}
Ausbildung: ${eduInfo}
F?higkeiten: ${profile?.skills?.map((s) => s.name).join(', ') || 'Fachliche und methodische Qualifikationen'}
Sprachen: ${profile?.languages?.map((l) => `${l.language} (${l.proficiencyLevel})`).join(', ') || 'Englisch, Deutsch'}
Motivation: ${profile?.rawMotivation || 'Hohe Lernbereitschaft und Motivation zur beruflichen Entwicklung in Deutschland.'}

Verfassen Sie ein professionelles deutsches Anschreiben (Bewerbungsschreiben) nach DIN 5008-Standard auf Deutsch.
Struktur:
1. Bezugnahme & Motivation
2. Relevante Qualifikationen & bisherige Erfolge
3. Sprachliche & kulturelle Vorbereitung auf Deutschland
Beginnen Sie mit "Sehr geehrte Damen und Herren," und schlie?en Sie mit "Mit freundlichen Gr??en,\n${user.firstName} ${user.lastName}". Keine erfundenen Angaben.`;

    const aiResponse = await this.aiService.runAgentStructured<any>(
      'COVER_LETTER',
      applicantId,
      prompt,
    );

    const title = isEnglish
      ? (opportunity ? `Cover Letter - ${opportunity.title} (${opportunity.organization || opportunity.company})` : `Cover Letter - Application for Germany`)
      : (opportunity ? `Bewerbung - ${opportunity.title} (${opportunity.organization || opportunity.company})` : `Bewerbungsschreiben - Ausbildung / Beruf in Deutschland`);

    const defaultContent = isEnglish
      ? `Dear Admissions Committee / Hiring Manager,\n\nI am writing to formally submit my application for ${opportunity ? opportunity.title : 'the position'}. With my academic background and dedication to professional excellence, I am confident in my preparedness to succeed and contribute meaningfully in Germany.\n\nThank you for your consideration, and I look forward to the opportunity to discuss my qualifications.\n\nSincerely,\n${user.firstName} ${user.lastName}`
      : `Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich mit gro?em Interesse um die Position als ${opportunity ? opportunity.title : 'Fachkraft in Ihrem Unternehmen'}. Aufgrund meiner fachlichen Vorbildung und meiner hohen Lernbereitschaft m?chte ich meine F?higkeiten gewinnbringend in Ihr Team einbringen.\n\nIch freue mich ?ber die Gelegenheit, mich Ihnen in einem pers?nlichen Gespr?ch vorzustellen.\n\nMit freundlichen Gr??en,\n${user.firstName} ${user.lastName}`;

    const saved = await this.prisma.$transaction(async (tx) => {
      const coverLetter = await tx.coverLetter.create({
        data: {
          applicantId,
          opportunityId: opportunity?.id,
          title,
          content: aiResponse?.data?.content || defaultContent,
          isAiGenerated: true,
          version: 1,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: applicantId,
          action: 'COVER_LETTER_GENERATION',
          entityType: 'COVER_LETTER',
          entityId: coverLetter.id,
          details: { language: isEnglish ? 'en' : 'de' },
        },
      });

      return coverLetter;
    });

    return saved;
  }

  async getCoverLetters(applicantId: string): Promise<any[]> {
    return this.prisma.coverLetter.findMany({
      where: { applicantId },
      include: { opportunity: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCoverLetterById(id: string, applicantId: string): Promise<any> {
    const cl = await this.prisma.coverLetter.findUnique({
      where: { id },
      include: { opportunity: true },
    });
    if (!cl) throw new NotFoundException('Cover letter not found');
    if (cl.applicantId !== applicantId) throw new ForbiddenException('Unauthorized access');
    return cl;
  }

  async updateCoverLetter(id: string, applicantId: string, content: string, title?: string): Promise<any> {
    const cl = await this.getCoverLetterById(id, applicantId);
    return this.prisma.coverLetter.update({
      where: { id: cl.id },
      data: {
        content,
        title: title || cl.title,
      },
    });
  }
}
