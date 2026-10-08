import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewStatus, UserRole } from '../common/enums';

@Injectable()
export class ConsultantService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignedApplicants(consultantId: string) {
    return this.prisma.user.findMany({
      where: { role: UserRole.APPLICANT },
      include: {
        profile: {
          include: {
            educations: true,
            languages: true,
          },
        },
        assessments: {
          orderBy: { evaluatedAt: 'desc' },
          take: 1,
        },
        recommendations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReviews(status?: ReviewStatus) {
    return this.prisma.consultantReview.findMany({
      where: status ? { status } : undefined,
      include: {
        applicant: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveReview(
    reviewId: string,
    consultantId: string,
    notes?: string,
  ): Promise<any> {
    const review = await this.prisma.consultantReview.findUnique({
      where: { id: reviewId },
      include: { applicant: true },
    });

    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consultantReview.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.APPROVED,
          consultantId,
          consultantNotes: notes || review.consultantNotes,
          resolution: 'Verified and approved by human Educaro consultant.',
          resolvedAt: new Date(),
        },
      });

      // Notify applicant
      await tx.notification.create({
        data: {
          userId: review.applicantId,
          title: 'Consultant Review Approved',
          message: 'An Educaro consultant has reviewed and approved your dossier for consular submission.',
          type: 'SUCCESS',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: consultantId,
          action: 'CONSULTANT_ACTION',
          entityType: 'CONSULTANT_REVIEW',
          entityId: review.id,
          details: { action: 'APPROVE', notes },
        },
      });

      return updated;
    });
  }

  async rejectReview(
    reviewId: string,
    consultantId: string,
    reason: string,
  ): Promise<any> {
    const review = await this.prisma.consultantReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consultantReview.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.REJECTED,
          consultantId,
          resolution: reason,
          resolvedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: review.applicantId,
          title: 'Review Notice from Advisor',
          message: `Your dossier requires adjustments: ${reason}`,
          type: 'WARNING',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: consultantId,
          action: 'CONSULTANT_ACTION',
          entityType: 'CONSULTANT_REVIEW',
          entityId: review.id,
          details: { action: 'REJECT', reason },
        },
      });

      return updated;
    });
  }

  async requestClarification(
    reviewId: string,
    consultantId: string,
    clarificationPrompt: string,
  ): Promise<any> {
    const review = await this.prisma.consultantReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consultantReview.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.CLARIFICATION_REQUESTED,
          consultantId,
          consultantNotes: clarificationPrompt,
        },
      });

      await tx.notification.create({
        data: {
          userId: review.applicantId,
          title: 'Clarification Requested by Educaro Consultant',
          message: clarificationPrompt,
          type: 'ACTION_REQUIRED',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: consultantId,
          action: 'CONSULTANT_ACTION',
          entityType: 'CONSULTANT_REVIEW',
          entityId: review.id,
          details: { action: 'REQUEST_CLARIFICATION', clarificationPrompt },
        },
      });

      return updated;
    });
  }
}
