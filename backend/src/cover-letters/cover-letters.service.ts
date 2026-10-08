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

  async generateCoverLetter(applicantId: string, opportunityId?: string): Promise<any> {
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

    const eduInfo = profile?.educations?.[0]
      ? `${profile.educations[0].degree} from ${profile.educations[0].institution}`
      : 'Degree on file';

    const prompt = `Applicant: ${user.firstName} ${user.lastName}
Goal: ${profile?.currentGoal}
Opportunity: ${opportunity ? `${opportunity.title} at ${opportunity.organization} in ${opportunity.location}` : 'General German Apprenticeship / Study Application'}
Education: ${eduInfo}
Skills: ${profile?.skills?.map((s) => s.name).join(', ') || 'Technical and practical skills'}
Languages: ${profile?.languages?.map((l) => `${l.language} (${l.proficiencyLevel})`).join(', ') || 'English, German'}
Motivation: ${profile?.rawMotivation || 'Deep commitment to German dual training and engineering precision.'}

Compose a professional German Anschreiben (Cover Letter) formatted according to DIN 5008 standards. Do not fabricate unverified claims.`;

    const aiResponse = await this.aiService.runAgentStructured<any>(
      'COVER_LETTER',
      applicantId,
      prompt,
    );

    const title = opportunity
      ? `Bewerbung - ${opportunity.title} (${opportunity.organization})`
      : `Bewerbung um einen Ausbildungsplatz / Studienplatz`;

    const saved = await this.prisma.$transaction(async (tx) => {
      const coverLetter = await tx.coverLetter.create({
        data: {
          applicantId,
          opportunityId: opportunity?.id,
          title,
          content: aiResponse?.data?.content || 'Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um die ausgeschriebene Stelle...',
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
