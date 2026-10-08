import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobApplicationAgent } from '../agents/job-application.agent';
import { ApplicationReadinessAgent } from '../agents/application-readiness.agent';
import { ApplicationStatus, UserRole } from '../common/enums';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobAppAgent: JobApplicationAgent,
    private readonly readinessAgent: ApplicationReadinessAgent,
  ) {}

  async listApplications(userId: string, role: string) {
    if (role === UserRole.ADMIN || role === UserRole.CONSULTANT) {
      return this.prisma.jobApplication.findMany({
        include: {
          opportunity: true,
          applicant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          cv: true,
          coverLetter: true,
          interviewRooms: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return this.prisma.jobApplication.findMany({
      where: { applicantId: userId },
      include: {
        opportunity: true,
        cv: true,
        coverLetter: true,
        interviewRooms: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getApplicationById(id: string, userId: string, role: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        opportunity: true,
        applicant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        cv: true,
        coverLetter: true,
        interviewRooms: {
          include: {
            scorecard: true,
            stages: {
              include: { questions: { include: { answers: true } } },
            },
            technicalAssessment: {
              include: { challenges: true },
            },
          },
        },
        invitations: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }

    if (role === UserRole.APPLICANT && application.applicantId !== userId) {
      throw new ForbiddenException('You cannot access applications belonging to other applicants.');
    }

    return application;
  }

  async prepareApplication(applicantId: string, opportunityId: string) {
    this.logger.log(`Preparing application for applicant ${applicantId} and opp ${opportunityId}`);

    // Verify qualification first
    const assessment = await this.prisma.qualificationAssessment.findFirst({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!assessment) {
      throw new BadRequestException(
        'Qualification evaluation is required before preparing an official application. Please complete qualification first.',
      );
    }

    const packageResult = await this.jobAppAgent.prepareApplicationPackage(
      applicantId,
      opportunityId,
    );

    return {
      success: true,
      message: 'Application prepared successfully. Applicant confirmation is required prior to submission.',
      package: packageResult,
    };
  }

  async confirmApplication(applicationId: string, applicantId: string) {
    this.logger.log(`Applicant ${applicantId} confirming submission of application ${applicationId}`);

    const result = await this.jobAppAgent.confirmAndSubmitApplication(
      applicationId,
      applicantId,
    );

    return {
      success: true,
      message: 'Application submitted successfully to German employer/institution.',
      application: result,
    };
  }
}
