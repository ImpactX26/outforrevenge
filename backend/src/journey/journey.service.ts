import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Journey } from '../database/entities/journey.entity';
import { JourneyStep } from '../database/entities/journey-step.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { Document } from '../database/entities/document.entity';
import { Video } from '../database/entities/video.entity';
import { QualificationAssessment } from '../database/entities/qualification-assessment.entity';
import { CV } from '../database/entities/cv.entity';
import { JourneyStepStatus } from '../common/enums';

@Injectable()
export class JourneyService {
  constructor(
    @InjectRepository(Journey)
    private readonly journeyRepo: Repository<Journey>,
    @InjectRepository(JourneyStep)
    private readonly stepRepo: Repository<JourneyStep>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(QualificationAssessment)
    private readonly assessmentRepo: Repository<QualificationAssessment>,
    @InjectRepository(CV)
    private readonly cvRepo: Repository<CV>,
  ) {}

  async getApplicantJourney(applicantId: string): Promise<Journey> {
    let journey = await this.journeyRepo.findOne({
      where: { applicantId },
      relations: ['steps'],
    });

    if (!journey) {
      journey = await this.initializeJourney(applicantId);
    }

    // Dynamic state refresh
    await this.evaluateJourneyState(journey);

    journey = await this.journeyRepo.findOne({
      where: { applicantId },
      relations: ['steps'],
    });

    if (journey?.steps) {
      journey.steps.sort((a, b) => a.stepOrder - b.stepOrder);
    }

    return journey!;
  }

  async getNextAction(applicantId: string): Promise<{ step: JourneyStep | null; message: string }> {
    const journey = await this.getApplicantJourney(applicantId);
    const inProgressStep = journey.steps.find((s) => s.status === JourneyStepStatus.IN_PROGRESS)
      || journey.steps.find((s) => s.status === JourneyStepStatus.PENDING);

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

  async completeStep(applicantId: string, stepCode: string): Promise<Journey> {
    const journey = await this.journeyRepo.findOne({
      where: { applicantId },
      relations: ['steps'],
    });
    if (!journey) throw new NotFoundException('Journey not found');

    const step = journey.steps.find((s) => s.code === stepCode);
    if (step) {
      step.status = JourneyStepStatus.COMPLETED;
      step.completedAt = new Date();
      await this.stepRepo.save(step);
    }

    return this.getApplicantJourney(applicantId);
  }

  private async initializeJourney(applicantId: string): Promise<Journey> {
    const journey = this.journeyRepo.create({
      applicantId,
      currentState: 'ONBOARDING',
      progressPercentage: 10,
    });
    const saved = await this.journeyRepo.save(journey);

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
      await this.stepRepo.save(
        this.stepRepo.create({
          journeyId: saved.id,
          stepOrder: s.order,
          code: s.code,
          title: s.title,
          description: s.description,
          status: s.status,
        }),
      );
    }

    return saved;
  }

  private async evaluateJourneyState(journey: Journey) {
    const profile = await this.profileRepo.findOne({ where: { userId: journey.applicantId } });
    const docs = await this.docRepo.find({ where: { applicantId: journey.applicantId } });
    const videos = await this.videoRepo.find({ where: { applicantId: journey.applicantId } });
    const assessment = await this.assessmentRepo.findOne({
      where: { applicantId: journey.applicantId },
      order: { evaluatedAt: 'DESC' },
    });
    const cvs = await this.cvRepo.find({ where: { applicantId: journey.applicantId } });

    let completedCount = 0;

    for (const step of journey.steps) {
      if (step.code === 'PROFILE_SETUP') {
        if (profile?.profileCompleteness && profile.profileCompleteness >= 30) {
          step.status = JourneyStepStatus.COMPLETED;
        }
      } else if (step.code === 'DOCUMENT_UPLOAD') {
        if (docs.length > 0) {
          step.status = JourneyStepStatus.COMPLETED;
        } else {
          step.status = JourneyStepStatus.IN_PROGRESS;
        }
      } else if (step.code === 'VIDEO_INTRO') {
        if (videos.length > 0) {
          step.status = JourneyStepStatus.COMPLETED;
        } else if (docs.length > 0) {
          step.status = JourneyStepStatus.IN_PROGRESS;
        }
      } else if (step.code === 'QUALIFICATION_CHECK') {
        if (assessment) {
          step.status = JourneyStepStatus.COMPLETED;
        } else if (docs.length > 0) {
          step.status = JourneyStepStatus.IN_PROGRESS;
        }
      } else if (step.code === 'OPPORTUNITY_MATCHING') {
        if (assessment) {
          step.status = JourneyStepStatus.COMPLETED;
        }
      } else if (step.code === 'EDUCARO_NEXT_STEP') {
        if (assessment) {
          step.status = JourneyStepStatus.IN_PROGRESS;
        }
      } else if (step.code === 'CV_GENERATION') {
        if (cvs.length > 0) {
          step.status = JourneyStepStatus.COMPLETED;
        } else if (assessment) {
          step.status = JourneyStepStatus.PENDING;
        }
      }

      if (step.status === JourneyStepStatus.COMPLETED) {
        completedCount++;
      }
      await this.stepRepo.save(step);
    }

    journey.progressPercentage = Math.round((completedCount / journey.steps.length) * 100);
    journey.lastEvaluatedAt = new Date();
    await this.journeyRepo.save(journey);
  }
}
