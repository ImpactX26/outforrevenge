import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

export interface InterviewPlanResult {
  durationMinutes: number;
  stages: {
    stageType: 'HR' | 'BEHAVIORAL' | 'TECHNICAL' | 'CODING' | 'LANGUAGE' | 'FINAL';
    name: string;
    durationMinutes: number;
    requiredCompetencies: string[];
    questions: {
      text: string;
      competency: string;
      difficulty: 'JUNIOR' | 'MID' | 'SENIOR';
      expectedKeyPoints: string[];
    }[];
  }[];
  technicalAssessmentRequired: boolean;
  codingChallengeRequired: boolean;
  recommendedLanguages: string[];
  confidence: number;
}

@Injectable()
export class InterviewPlanningAgent {
  private readonly logger = new Logger(InterviewPlanningAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async planInterview(
    opportunityId: string,
    applicantId: string,
    parentExecutionId?: string,
  ): Promise<InterviewPlanResult> {
    this.logger.log(`Planning interview for applicant ${applicantId} and opportunity ${opportunityId}`);

    const [opportunity, profile] = await Promise.all([
      this.prisma.opportunity.findUnique({ where: { id: opportunityId } }),
      this.prisma.applicantProfile.findUnique({
        where: { userId: applicantId },
        include: { educations: true, employments: true, skills: true, languages: true },
      }),
    ]);

    if (!opportunity) throw new NotFoundException('Opportunity not found');

    const goal = profile?.currentGoal || 'EMPLOYMENT';
    const skillsList = profile?.skills?.map(s => s.name).join(', ') || '';
    const languagesList = profile?.languages?.map(l => `${l.language} (${l.proficiencyLevel})`).join(', ') || '';

    const prompt = `Target Opportunity:
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Type: ${opportunity.type}
Requirements: ${JSON.stringify(opportunity.requirements)}
Description: ${opportunity.description}

Candidate Profile:
Pathway Goal: ${goal}
Skills: ${skillsList}
Languages: ${languagesList}
Education: ${JSON.stringify(profile?.educations || [])}
Work Experience: ${JSON.stringify(profile?.employments || [])}

Generate a comprehensive, role-specific German interview plan tailored specifically for this ${goal} pathway:
- If STUDY: Focus on academic motivation, coursework knowledge, research capability, German university fit.
- If AUSBILDUNG: Focus on practical aptitude, willingness to learn, teamwork, German workplace communication, vocational passion.
- If EMPLOYMENT: Focus on technical depth, architecture, concrete projects, debugging, German workplace integration.

Do NOT use generic boilerplate questions. Make questions highly specific to ${opportunity.title}.
Determine if a coding challenge is needed.`;

    try {
      const res = await this.aiService.runAgentStructured<InterviewPlanResult>(
        'INTERVIEW_PLANNING',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'INTERVIEW_FLOW',
      );

      if (res.data?.stages && res.data.stages.length > 0) {
        return {
          ...res.data,
          confidence: res.execution?.confidence || 0.9,
        };
      }
    } catch (err: any) {
      this.logger.warn(`AI interview planning fallback: ${err.message}`);
    }

    const isTech = opportunity.title.toLowerCase().includes('developer') ||
                   opportunity.title.toLowerCase().includes('engineer') ||
                   opportunity.title.toLowerCase().includes('firmware') ||
                   opportunity.title.toLowerCase().includes('software');

    return {
      durationMinutes: 45,
      technicalAssessmentRequired: isTech,
      codingChallengeRequired: isTech,
      recommendedLanguages: ['typescript', 'c', 'python'],
      stages: [
        {
          stageType: 'HR',
          name: 'Introduction & Motivation',
          durationMinutes: 10,
          requiredCompetencies: ['Motivation for Germany', 'Communication', 'Cultural Adaptability'],
          questions: [
            {
              text: `Why did you choose ${opportunity.organization} in Germany for your ${goal.toLowerCase()} journey?`,
              competency: 'Motivation',
              difficulty: 'JUNIOR',
              expectedKeyPoints: ['Knowledge of company', 'Long-term German career vision', 'Relocation readiness'],
            },
            {
              text: 'How are you preparing for German language and professional workplace communication?',
              competency: 'Language & Adaptability',
              difficulty: 'JUNIOR',
              expectedKeyPoints: ['Current CEFR level or learning plan', 'Daily practice', 'Cultural awareness'],
            },
          ],
        },
        {
          stageType: isTech ? 'TECHNICAL' : 'BEHAVIORAL',
          name: isTech ? 'Technical Competency & Architecture' : 'Role Competency & Past Experience',
          durationMinutes: 20,
          requiredCompetencies: isTech ? ['Core Domain Knowledge', 'System Problem Solving'] : ['Problem Solving', 'Teamwork'],
          questions: [
            {
              text: `Walk us through a complex project where you applied ${skillsList.split(',')[0] || 'core technical concepts'}. What trade-offs did you make?`,
              competency: 'Hands-on Execution',
              difficulty: 'MID',
              expectedKeyPoints: ['Clear architecture', 'Overcoming challenges', 'Measurable impact'],
            },
            {
              text: 'How do you approach debugging when facing unexpected behavior in production or lab environments?',
              competency: 'Problem Solving',
              difficulty: 'MID',
              expectedKeyPoints: ['Structured hypothesis testing', 'Logging/monitoring', 'Root-cause analysis'],
            },
          ],
        },
        ...(isTech ? [{
          stageType: 'CODING' as const,
          name: 'Hands-on Collaborative Coding',
          durationMinutes: 15,
          requiredCompetencies: ['Clean Code', 'Algorithmic Thinking', 'Testing'],
          questions: [
            {
              text: 'Implement the requested component in the collaborative editor with proper error handling and edge cases.',
              competency: 'Coding',
              difficulty: 'MID' as const,
              expectedKeyPoints: ['Edge case awareness', 'Readable syntax', 'Test case validation'],
            },
          ],
        }] : []),
      ],
      confidence: 0.85,
    };
  }
}
