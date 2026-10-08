import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity } from '../database/entities/opportunity.entity';
import { OpportunityMatch } from '../database/entities/opportunity-match.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { OpportunityType } from '../common/enums';
import { AiService } from '../ai/ai.service';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    @InjectRepository(OpportunityMatch)
    private readonly matchRepo: Repository<OpportunityMatch>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    private readonly aiService: AiService,
  ) {}

  async getAllOpportunities(type?: OpportunityType): Promise<Opportunity[]> {
    const query = this.opportunityRepo.createQueryBuilder('opp');
    if (type) {
      query.where('opp.type = :type', { type });
    }
    return query.orderBy('opp.createdAt', 'DESC').getMany();
  }

  async getOpportunityById(id: string): Promise<Opportunity> {
    const opp = await this.opportunityRepo.findOne({ where: { id } });
    if (!opp) {
      throw new NotFoundException('Opportunity not found');
    }
    return opp;
  }

  async matchApplicant(applicantId: string, parentExecutionId?: string): Promise<OpportunityMatch[]> {
    const profile = await this.profileRepo.findOne({
      where: { userId: applicantId },
      relations: ['educations', 'employments', 'skills', 'languages'],
    });

    if (!profile) {
      throw new NotFoundException('Applicant profile not found');
    }

    const allOpportunities = await this.opportunityRepo.find();
    const matches: OpportunityMatch[] = [];

    const applicantGerman = profile.languages?.find((l) => l.language.toLowerCase().includes('german'))?.proficiencyLevel || 'None';
    const applicantEnglish = profile.languages?.find((l) => l.language.toLowerCase().includes('english'))?.proficiencyLevel || 'None';
    const applicantSkills = profile.skills?.map((s) => s.name.toLowerCase()) || [];

    for (const opp of allOpportunities) {
      const matchedReqs: string[] = [];
      const missingReqs: string[] = [];
      let score = 50; // base score for pathway consideration

      const req = opp.requirements || {};

      // Pathway alignment
      if (profile.currentGoal && opp.type.toString() === profile.currentGoal.toString()) {
        score += 20;
        matchedReqs.push(`Matches your targeted Germany pathway (${opp.type}).`);
      }

      // German requirement
      if (req.minGermanLevel) {
        if (this.isLanguageLevelSufficient(applicantGerman, req.minGermanLevel)) {
          score += 15;
          matchedReqs.push(`Satisfies German language criteria (${applicantGerman} vs ${req.minGermanLevel} required).`);
        } else {
          score -= 10;
          missingReqs.push(`Requires German ${req.minGermanLevel} (you currently have ${applicantGerman}).`);
        }
      }

      // Skills alignment
      if (req.skillsRequired && req.skillsRequired.length > 0) {
        const matchingSkills = req.skillsRequired.filter((s) =>
          applicantSkills.some((ask) => ask.includes(s.toLowerCase()) || s.toLowerCase().includes(ask)),
        );
        if (matchingSkills.length > 0) {
          score += 15;
          matchedReqs.push(`Relevant skills: ${matchingSkills.join(', ')}.`);
        } else {
          missingReqs.push(`Preferred skills to develop: ${req.skillsRequired.join(', ')}.`);
        }
      }

      // Degree alignment
      if (profile.educations?.length) {
        score += 10;
        matchedReqs.push(`Verified academic degree: ${profile.educations[0].degree}.`);
      }

      const finalMatchPercentage = Math.min(98, Math.max(25, score));
      const reason = `Matched ${finalMatchPercentage}% based on ${matchedReqs.length} verified criteria.`;
      const nextAction = missingReqs.length > 0
        ? `Bridge criteria: ${missingReqs[0]}`
        : 'Eligible to generate tailored application and CV.';

      // Check existing match
      let match = await this.matchRepo.findOne({
        where: { applicantId, opportunityId: opp.id },
      });

      if (!match) {
        match = this.matchRepo.create({
          applicantId,
          opportunityId: opp.id,
          matchPercentage: finalMatchPercentage,
          matchedRequirements: matchedReqs,
          missingRequirements: missingReqs,
          reason,
          nextAction,
        });
      } else {
        match.matchPercentage = finalMatchPercentage;
        match.matchedRequirements = matchedReqs;
        match.missingRequirements = missingReqs;
        match.reason = reason;
        match.nextAction = nextAction;
      }

      const savedMatch = await this.matchRepo.save(match);
      savedMatch.opportunity = opp;
      matches.push(savedMatch);
    }

    // Sort by match percentage descending
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return matches;
  }

  async getApplicantMatches(applicantId: string): Promise<OpportunityMatch[]> {
    let matches = await this.matchRepo.find({
      where: { applicantId },
      relations: ['opportunity'],
      order: { matchPercentage: 'DESC' },
    });

    if (matches.length === 0) {
      matches = await this.matchApplicant(applicantId);
    }

    return matches;
  }

  private isLanguageLevelSufficient(current: string, required: string): boolean {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'];
    const cIdx = levels.indexOf(current.toUpperCase());
    const rIdx = levels.indexOf(required.toUpperCase());
    if (cIdx === -1 || rIdx === -1) return false;
    return cIdx >= rIdx;
  }
}
