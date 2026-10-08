import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JourneyStepStatus } from '../common/enums';

@Injectable()
export class JourneyService {
  constructor(private readonly prisma: PrismaService) {}

  async getApplicantJourney(applicantId: string): Promise<any> {
    let journey = await this.prisma.journey.findUnique({
      where: { applicantId },
      include: { steps: true },
    });

    if (!journey) {
      journey = await this.initializeJourney(applicantId);
    }

    // Dynamic state refresh
    await this.evaluateJourneyState(journey);

    journey = await this.prisma.journey.findUnique({
      where: { applicantId },
      include: { steps: true },
    });

    if (journey?.steps) {
      journey.steps.sort((a, b) => a.stepOrder - b.stepOrder);
    }

    return journey!;
  }

  async getNextAction(applicantId: string): Promise<{ step: any | null; message: string }> {
    const journey = await this.getApplicantJourney(applicantId);
    const inProgressStep =
      journey.steps.find((s: any) => s.status === JourneyStepStatus.IN_PROGRESS) ||
      journey.steps.find((s: any) => s.status === JourneyStepStatus.PENDING);

    if (inProgressStep) {
      return {
        step: inProgressStep,
        message: `Next recommended action: ${inProgressStep.title}`,
      };
    }

    return {
      step: null,
      message: 'All core journey steps completed! You are ready for German applications and consular processing.',
    };
  }

  async completeStep(applicantId: string, stepCode: string): Promise<any> {
    const journey = await this.prisma.journey.findUnique({
      where: { applicantId },
      include: { steps: true },
    });
    if (!journey) throw new NotFoundException('Journey not found');

    const step = journey.steps.find((s: any) => s.code === stepCode);
    if (step) {
      await this.prisma.journeyStep.update({
        where: { id: step.id },
        data: {
          status: JourneyStepStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }

    return this.getApplicantJourney(applicantId);
  }

  private async initializeJourney(applicantId: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const journey = await tx.journey.create({
        data: {
          applicantId,
          currentState: 'ONBOARDING',
          progressPercentage: 10,
        },
      });

      const defaultSteps = [
        { order: 1, code: 'PROFILE_SETUP', title: 'Complete Profile & Goal', description: 'Personal details and selected Germany pathway (Study, Ausbildung, Employment).', status: JourneyStepStatus.COMPLETED },
        { order: 2, code: 'DOCUMENT_UPLOAD', title: 'Upload Academic Documents', description: 'Degrees, marksheets, and language certificates.', status: JourneyStepStatus.IN_PROGRESS },
        { order: 3, code: 'VIDEO_INTRO', title: 'Record Video Introduction', description: '60-second video overview of motivation and capabilities.', status: JourneyStepStatus.PENDING },
        { order: 4, code: 'QUALIFICATION_CHECK', title: 'Qualification Assessment', description: 'Systematic requirement verification against German criteria.', status: JourneyStepStatus.PENDING },
        { order: 5, code: 'OPPORTUNITY_MATCHING', title: 'Explore Opportunities', description: 'Matched Study, Ausbildung or Job positions.', status: JourneyStepStatus.LOCKED },
        { order: 6, code: 'EDUCARO_NEXT_STEP', title: 'Educaro Next Step', description: 'Recommended services and application guidance.', status: JourneyStepStatus.LOCKED },
        { order: 7, code: 'CV_GENERATION', title: 'Generate German Format CV', description: 'Professional German standard Lebenslauf CV builder.', status: JourneyStepStatus.LOCKED },
        { order: 8, code: 'INTERVIEW_PREP', title: 'Interview Preparation', description: 'Simulated German technical and behavioral interview preparation.', status: JourneyStepStatus.LOCKED },
      ];

      for (const s of defaultSteps) {
        await tx.journeyStep.create({
          data: {
            journeyId: journey.id,
            stepOrder: s.order,
            code: s.code,
            title: s.title,
            description: s.description,
            status: s.status,
          },
        });
      }

      return tx.journey.findUnique({
        where: { id: journey.id },
        include: { steps: true },
      });
    });
  }

  private async evaluateJourneyState(journey: any) {
    const profile = await this.prisma.applicantProfile.findUnique({ where: { userId: journey.applicantId } });
    const docs = await this.prisma.document.findMany({ where: { applicantId: journey.applicantId } });
    const videos = await this.prisma.video.findMany({ where: { applicantId: journey.applicantId } });
    const assessment = await this.prisma.qualificationAssessment.findFirst({
      where: { applicantId: journey.applicantId },
      orderBy: { evaluatedAt: 'desc' },
    });
    const cvs = await this.prisma.cV.findMany({ where: { applicantId: journey.applicantId } });

    await this.prisma.$transaction(async (tx) => {
      let completedCount = 0;

      for (const step of journey.steps) {
        let newStatus = step.status;

        if (step.code === 'PROFILE_SETUP') {
          if (profile?.profileCompleteness && profile.profileCompleteness >= 30) {
            newStatus = JourneyStepStatus.COMPLETED;
          }
        } else if (step.code === 'DOCUMENT_UPLOAD') {
          if (docs.length > 0) {
            newStatus = JourneyStepStatus.COMPLETED;
          } else {
            newStatus = JourneyStepStatus.IN_PROGRESS;
          }
        } else if (step.code === 'VIDEO_INTRO') {
          if (videos.length > 0) {
            newStatus = JourneyStepStatus.COMPLETED;
          } else if (docs.length > 0) {
            newStatus = JourneyStepStatus.IN_PROGRESS;
          }
        } else if (step.code === 'QUALIFICATION_CHECK') {
          if (assessment) {
            newStatus = JourneyStepStatus.COMPLETED;
          } else if (docs.length > 0) {
            newStatus = JourneyStepStatus.IN_PROGRESS;
          }
        } else if (step.code === 'OPPORTUNITY_MATCHING') {
          if (assessment) {
            newStatus = JourneyStepStatus.COMPLETED;
          }
        } else if (step.code === 'EDUCARO_NEXT_STEP') {
          if (assessment) {
            newStatus = JourneyStepStatus.IN_PROGRESS;
          }
        } else if (step.code === 'CV_GENERATION') {
          if (cvs.length > 0) {
            newStatus = JourneyStepStatus.COMPLETED;
          } else if (assessment) {
            newStatus = JourneyStepStatus.PENDING;
          }
        }

        if (newStatus === JourneyStepStatus.COMPLETED) {
          completedCount++;
        }

        if (newStatus !== step.status) {
          await tx.journeyStep.update({
            where: { id: step.id },
            data: { status: newStatus },
          });
        }
      }

      const progressPercentage = Math.round((completedCount / journey.steps.length) * 100);
      await tx.journey.update({
        where: { id: journey.id },
        data: {
          progressPercentage,
          lastEvaluatedAt: new Date(),
        },
      });
    });
  }
}
