import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ApplicationReadinessAgent } from './application-readiness.agent';
import { ApplicationStatus } from '../common/enums';

export interface PreparedApplicationDto {
  applicationId: string;
  opportunityId: string;
  applicantId: string;
  status: ApplicationStatus;
  summary: string;
  cvId: string;
  coverLetterId?: string;
  readinessScore: number;
  matchedRequirements: string[];
  missingRequirements: string[];
  fieldValues: Record<string, any>;
  applicantConfirmationRequired: boolean;
}

@Injectable()
export class JobApplicationAgent {
  private readonly logger = new Logger(JobApplicationAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly readinessAgent: ApplicationReadinessAgent,
  ) {}

  async prepareApplicationPackage(
    applicantId: string,
    opportunityId: string,
    parentExecutionId?: string,
  ): Promise<PreparedApplicationDto> {
    this.logger.log(`Preparing application package for applicant ${applicantId} and opportunity ${opportunityId}`);

    const [applicant, opportunity, profile, cv, coverLetter] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: applicantId } }),
      this.prisma.opportunity.findUnique({ where: { id: opportunityId } }),
      this.prisma.applicantProfile.findUnique({
        where: { userId: applicantId },
        include: { educations: true, employments: true, skills: true, languages: true },
      }),
      this.prisma.cV.findFirst({
        where: { applicantId },
        orderBy: [{ isPublished: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.coverLetter.findFirst({
        where: { applicantId, opportunityId },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    if (!applicant) throw new NotFoundException('Applicant not found');
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    if (!cv) {
      throw new BadRequestException('A verified German-standard CV is required before preparing an application.');
    }

    const readiness = await this.readinessAgent.assessReadiness(
      applicantId,
      opportunityId,
      parentExecutionId,
    );

    const fullName = `${applicant.firstName} ${applicant.lastName}`.trim();

    const prompt = `Applicant Name: ${fullName} (${applicant.email})
Goal: ${profile?.currentGoal || 'EMPLOYMENT'}
Opportunity: ${opportunity.title} at ${opportunity.organization} (Type: ${opportunity.type})
Requirements: ${JSON.stringify(opportunity.requirements)}
Applicant Skills: ${JSON.stringify(profile?.skills?.map(s => s.name) || [])}
Applicant Languages: ${JSON.stringify(profile?.languages || [])}
Applicant Education: ${JSON.stringify(profile?.educations || [])}
Applicant Experience: ${JSON.stringify(profile?.employments || [])}
Readiness Score: ${readiness.readinessScore}
Missing Requirements: ${JSON.stringify(readiness.missingItems)}

Generate an authentic, professional application summary for German employers/universities and structured application fields.
Strict Rule: NEVER invent or hallucinate any degree, employment, date, or achievement. Use ONLY the verified profile information provided.`;

    let summary = `Application of ${fullName} for ${opportunity.title} at ${opportunity.organization}.`;
    let fieldValues: Record<string, any> = {
      fullName,
      email: applicant.email,
      phone: profile?.phone || '',
      location: profile?.location || 'India',
      targetRole: opportunity.title,
      company: opportunity.organization,
      germanLevel: profile?.languages?.find(l => l.language.toLowerCase().includes('german'))?.proficiencyLevel || 'Pending',
      englishLevel: profile?.languages?.find(l => l.language.toLowerCase().includes('english'))?.proficiencyLevel || 'Proficient',
      highestDegree: profile?.educations?.[0]?.degree || 'Pending Verification',
      fieldOfStudy: profile?.educations?.[0]?.fieldOfStudy || '',
    };

    try {
      const res = await this.aiService.runAgentStructured<{
        summary: string;
        fields: Record<string, any>;
      }>(
        'JOB_APPLICATION',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'APPLICATION_FLOW',
      );

      if (res.data?.summary) summary = res.data.summary;
      if (res.data?.fields) fieldValues = { ...fieldValues, ...res.data.fields };
    } catch (err: any) {
      this.logger.warn(`AI job application preparation fallback: ${err.message}`);
    }

    const applicationStatus = readiness.ready
      ? ApplicationStatus.READY_FOR_REVIEW
      : ApplicationStatus.DRAFT;

    const existing = await this.prisma.jobApplication.findFirst({
      where: { applicantId, opportunityId },
    });

    const reportData = {
      missingRequirements: readiness.missingItems,
      matchedRequirements: readiness.matchedRequirements,
      warnings: readiness.warnings,
      recommendations: readiness.recommendations,
    };
    const packageData = {
      summary,
      fieldValues,
    };

    let jobApp;
    if (existing) {
      jobApp = await this.prisma.jobApplication.update({
        where: { id: existing.id },
        data: {
          cvId: cv.id,
          coverLetterId: coverLetter?.id,
          readinessScore: readiness.readinessScore,
          readinessReport: reportData,
          preparedPackage: packageData,
          status: applicationStatus,
        },
      });
    } else {
      jobApp = await this.prisma.jobApplication.create({
        data: {
          applicantId,
          opportunityId,
          cvId: cv.id,
          coverLetterId: coverLetter?.id,
          readinessScore: readiness.readinessScore,
          readinessReport: reportData,
          preparedPackage: packageData,
          status: applicationStatus,
        },
      });
    }

    return {
      applicationId: jobApp.id,
      opportunityId,
      applicantId,
      status: jobApp.status,
      summary,
      cvId: cv.id,
      coverLetterId: coverLetter?.id,
      readinessScore: readiness.readinessScore,
      matchedRequirements: readiness.matchedRequirements,
      missingRequirements: readiness.missingItems,
      fieldValues,
      applicantConfirmationRequired: true,
    };
  }

  async confirmAndSubmitApplication(
    applicationId: string,
    applicantId: string,
  ): Promise<any> {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { opportunity: true, cv: true, coverLetter: true },
    });

    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    if (application.applicantId !== applicantId) {
      throw new BadRequestException('Unauthorized: You cannot submit an application belonging to another applicant');
    }

    if (application.status === ApplicationStatus.SUBMITTED || application.status === ApplicationStatus.INTERVIEW_INVITED) {
      return application;
    }

    const report = (application.readinessReport as any) || {};
    const missing = report.missingRequirements || [];

    if ((application.readinessScore || 0) < 70 && missing.length > 0) {
      throw new BadRequestException(
        `Application cannot be confirmed until critical requirements are satisfied: ${missing.join(', ')}`,
      );
    }

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.SUBMITTED,
        confirmedAt: new Date(),
        submittedAt: new Date(),
      },
      include: { opportunity: true, cv: true, coverLetter: true },
    });

    await this.prisma.agentExecution.create({
      data: {
        agentType: 'JOB_APPLICATION',
        applicantId,
        status: 'COMPLETED',
        inputReference: `Applicant confirmed and submitted application for ${application.opportunity.title}`,
        output: {
          applicationId: updated.id,
          status: updated.status,
          submittedAt: updated.submittedAt,
        },
        triggeredBy: 'APPLICANT_CONFIRMATION',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return updated;
  }
}
