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

  async generateCoverLetter(applicantId: string, opportunityId?: string, language = 'de'): Promise<any> {
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
Goal: ${profile?.currentGoal}
Opportunity: ${opportunity ? `${opportunity.title} at ${opportunity.organization} in ${opportunity.location}` : 'Higher Education / Dual Vocational Application in Germany'}
Education: ${eduInfo}
Skills: ${profile?.skills?.map((s) => s.name).join(', ') || 'Technical and practical skills'}
Languages: ${profile?.languages?.map((l) => `${l.language} (${l.proficiencyLevel})`).join(', ') || 'English, German'}
Motivation: ${profile?.rawMotivation || 'Deep commitment to dual training and vocational excellence in Germany.'}

Compose a professional, compelling English Cover Letter formatted for German employers and universities. Structure with clear paragraphs (Motivation, Qualifications, Relevance to Germany). Open with "Dear Admissions Team / Hiring Manager," and close with "Sincerely, ${user.firstName} ${user.lastName}". Do not fabricate unverified claims.`
      : `Applicant: ${user.firstName} ${user.lastName}
Goal: ${profile?.currentGoal}
Opportunity: ${opportunity ? `${opportunity.title} at ${opportunity.organization} in ${opportunity.location}` : 'General German Apprenticeship / Study Application'}
Education: ${eduInfo}
Skills: ${profile?.skills?.map((s) => s.name).join(', ') || 'Technical and practical skills'}
Languages: ${profile?.languages?.map((l) => `${l.language} (${l.proficiencyLevel})`).join(', ') || 'English, German'}
Motivation: ${profile?.rawMotivation || 'Deep commitment to German dual training and engineering precision.'}

Compose a professional German Anschreiben (Cover Letter) formatted according to DIN 5008 standards auf Deutsch. Open with "Sehr geehrte Damen und Herren," and close with "Mit freundlichen Grüßen,\n${user.firstName} ${user.lastName}". Do not fabricate unverified claims.`;

    const aiResponse = await this.aiService.runAgentStructured<any>(
      'COVER_LETTER',
      applicantId,
      prompt,
    );

    const title = isEnglish
      ? (opportunity ? `Cover Letter - ${opportunity.title} (${opportunity.organization})` : `Cover Letter - German Vocational / Study Application`)
      : (opportunity ? `Bewerbung - ${opportunity.title} (${opportunity.organization})` : `Bewerbung um einen Ausbildungsplatz / Studienplatz`);

    const defaultContent = isEnglish
      ? `Dear Admissions Committee / Hiring Manager,\n\nI am writing to formally submit my application for ${opportunity ? opportunity.title : 'the vocational program'}. With my academic background and dedication to excellence, I am confident in my preparedness to succeed in Germany.\n\nThank you for your consideration.\n\nSincerely,\n${user.firstName} ${user.lastName}`
      : `Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um die ausgeschriebene Stelle für ${opportunity ? opportunity.title : 'eine Ausbildung in Deutschland'}. Aufgrund meiner fachlichen Vorbildung und meiner hohen Lernbereitschaft möchte ich meine Fähigkeiten gewinnbringend bei Ihnen einbringen.\n\nIch freue mich auf Ihre positive Rückmeldung.\n\nMit freundlichen Grüßen,\n${user.firstName} ${user.lastName}`;

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
