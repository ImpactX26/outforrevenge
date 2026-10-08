import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoverLetter } from '../database/entities/cover-letter.entity';
import { Opportunity } from '../database/entities/opportunity.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { User } from '../database/entities/user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { LocalStorageService } from '../storage/local-storage.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CoverLettersService {
  constructor(
    @InjectRepository(CoverLetter)
    private readonly coverLetterRepo: Repository<CoverLetter>,
    @InjectRepository(Opportunity)
    private readonly oppRepo: Repository<Opportunity>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly storageService: LocalStorageService,
    private readonly aiService: AiService,
  ) {}

  async generateCoverLetter(applicantId: string, opportunityId?: string): Promise<CoverLetter> {
    const user = await this.userRepo.findOne({ where: { id: applicantId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepo.findOne({
      where: { userId: applicantId },
      relations: ['educations', 'employments', 'skills', 'languages'],
    });

    let opportunity: Opportunity | null = null;
    if (opportunityId) {
      opportunity = await this.oppRepo.findOne({ where: { id: opportunityId } });
    }

    const prompt = `Applicant: ${user.firstName} ${user.lastName}
Goal: ${profile?.currentGoal}
Opportunity: ${opportunity ? `${opportunity.title} at ${opportunity.organization} in ${opportunity.location}` : 'General German Apprenticeship / Study Application'}
Education: ${profile?.educations?.[0]?.degree || 'Bachelor Degree'} from ${profile?.educations?.[0]?.institution || 'University'}
Skills: ${profile?.skills?.map((s) => s.name).join(', ')}
Languages: ${profile?.languages?.map((l) => `${l.language} (${l.proficiencyLevel})`).join(', ')}
Motivation: ${profile?.rawMotivation || 'Deep commitment to German dual training and engineering precision.'}

Compose a professional German Anschreiben (Cover Letter) formatted according to DIN 5008 standards. Do not fabricate unverified claims.`;

    const { data } = await this.aiService.runAgentStructured<any>(
      'COVER_LETTER',
      applicantId,
      prompt,
    );

    const title = opportunity
      ? `Bewerbung - ${opportunity.title} (${opportunity.organization})`
      : `Bewerbung um einen Ausbildungsplatz / Studienplatz`;

    const coverLetter = this.coverLetterRepo.create({
      applicantId,
      opportunityId: opportunity?.id,
      title,
      content: data?.content || 'Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um die ausgeschriebene Stelle...',
      isAiGenerated: true,
      version: 1,
    });

    const saved = await this.coverLetterRepo.save(coverLetter);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: applicantId,
        action: 'COVER_LETTER_GENERATION',
        entityType: 'COVER_LETTER',
        entityId: saved.id,
      }),
    );

    return saved;
  }

  async getCoverLetters(applicantId: string): Promise<CoverLetter[]> {
    return this.coverLetterRepo.find({
      where: { applicantId },
      relations: ['opportunity'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCoverLetterById(id: string, applicantId: string): Promise<CoverLetter> {
    const cl = await this.coverLetterRepo.findOne({
      where: { id },
      relations: ['opportunity'],
    });
    if (!cl) throw new NotFoundException('Cover letter not found');
    if (cl.applicantId !== applicantId) throw new ForbiddenException('Unauthorized access');
    return cl;
  }

  async updateCoverLetter(id: string, applicantId: string, content: string, title?: string): Promise<CoverLetter> {
    const cl = await this.getCoverLetterById(id, applicantId);
    cl.content = content;
    if (title) cl.title = title;
    return this.coverLetterRepo.save(cl);
  }
}
