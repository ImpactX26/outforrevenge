import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpportunityType } from '../common/enums';
import { AiService } from '../ai/ai.service';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async getAllOpportunities(type?: OpportunityType): Promise<any[]> {
    return this.prisma.opportunity.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOpportunityById(id: string): Promise<any> {
    const opp = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!opp) {
      throw new NotFoundException('Opportunity not found');
    }
    return opp;
  }

  async matchApplicant(applicantId: string, parentExecutionId?: string): Promise<any[]> {
    const profile = await this.prisma.applicantProfile.findUnique({
      where: { userId: applicantId },
      include: {
        educations: true,
        employments: true,
        skills: true,
        languages: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Applicant profile not found');
    }

    const allOpportunities = await this.prisma.opportunity.findMany();
    const matches: any[] = [];

    const applicantGerman = profile.languages?.find((l) => l.language.toLowerCase().includes('german'))?.proficiencyLevel || 'None';
    const applicantEnglish = profile.languages?.find((l) => l.language.toLowerCase().includes('english'))?.proficiencyLevel || 'None';
    const applicantSkills = profile.skills?.map((s) => s.name.toLowerCase()) || [];

    for (const opp of allOpportunities) {
      const matchedReqs: string[] = [];
      const missingReqs: string[] = [];
      let score = 50; // base score for pathway consideration

      const req = (opp.requirements as any) || {};

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
        const matchingSkills = req.skillsRequired.filter((s: string) =>
          applicantSkills.some((ask: string) => ask.includes(s.toLowerCase()) || s.toLowerCase().includes(ask)),
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
      const existingMatch = await this.prisma.opportunityMatch.findFirst({
        where: { applicantId, opportunityId: opp.id },
      });

      let savedMatch;
      if (!existingMatch) {
        savedMatch = await this.prisma.opportunityMatch.create({
          data: {
            applicantId,
            opportunityId: opp.id,
            matchPercentage: finalMatchPercentage,
            matchedRequirements: matchedReqs,
            missingRequirements: missingReqs,
            reason,
            nextAction,
          },
          include: { opportunity: true },
        });
      } else {
        savedMatch = await this.prisma.opportunityMatch.update({
          where: { id: existingMatch.id },
          data: {
            matchPercentage: finalMatchPercentage,
            matchedRequirements: matchedReqs,
            missingRequirements: missingReqs,
            reason,
            nextAction,
          },
          include: { opportunity: true },
        });
      }

      matches.push(savedMatch);
    }

    // Sort by match percentage descending
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return matches;
  }

  async getApplicantMatches(applicantId: string): Promise<any[]> {
    let matches = await this.prisma.opportunityMatch.findMany({
      where: { applicantId },
      include: { opportunity: true },
      orderBy: { matchPercentage: 'desc' },
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
