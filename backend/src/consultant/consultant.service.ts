import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultantReview } from '../database/entities/consultant-review.entity';
import { User } from '../database/entities/user.entity';
import { Notification } from '../database/entities/notification.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { ReviewStatus, UserRole } from '../common/enums';

@Injectable()
export class ConsultantService {
  constructor(
    @InjectRepository(ConsultantReview)
    private readonly reviewRepo: Repository<ConsultantReview>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getAssignedApplicants(consultantId: string) {
    return this.userRepo.find({
      where: { role: UserRole.APPLICANT },
      relations: ['profile', 'profile.educations', 'profile.languages', 'assessments', 'recommendations'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReviews(status?: ReviewStatus) {
    const query = this.reviewRepo.createQueryBuilder('rev')
      .leftJoinAndSelect('rev.applicant', 'applicant')
      .leftJoinAndSelect('applicant.profile', 'profile')
      .orderBy('rev.createdAt', 'DESC');

    if (status) {
      query.where('rev.status = :status', { status });
    }

    return query.getMany();
  }

  async approveReview(
    reviewId: string,
    consultantId: string,
    notes?: string,
  ): Promise<ConsultantReview> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['applicant'],
    });

    if (!review) throw new NotFoundException('Review not found');

    review.status = ReviewStatus.APPROVED;
    review.consultantId = consultantId;
    review.consultantNotes = notes || review.consultantNotes;
    review.resolution = 'Verified and approved by human Educaro consultant.';
    review.resolvedAt = new Date();

    const saved = await this.reviewRepo.save(review);

    // Notify applicant
    await this.notifRepo.save(
      this.notifRepo.create({
        userId: review.applicantId,
        title: 'Consultant Review Approved',
        message: 'An Educaro consultant has reviewed and approved your dossier for consular submission.',
        type: 'SUCCESS',
      }),
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: consultantId,
        action: 'CONSULTANT_ACTION',
        entityType: 'CONSULTANT_REVIEW',
        entityId: review.id,
        details: { action: 'APPROVE', notes },
      }),
    );

    return saved;
  }

  async rejectReview(
    reviewId: string,
    consultantId: string,
    reason: string,
  ): Promise<ConsultantReview> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    review.status = ReviewStatus.REJECTED;
    review.consultantId = consultantId;
    review.resolution = reason;
    review.resolvedAt = new Date();

    const saved = await this.reviewRepo.save(review);

    await this.notifRepo.save(
      this.notifRepo.create({
        userId: review.applicantId,
        title: 'Review Notice from Advisor',
        message: `Your dossier requires adjustments: ${reason}`,
        type: 'WARNING',
      }),
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: consultantId,
        action: 'CONSULTANT_ACTION',
        entityType: 'CONSULTANT_REVIEW',
        entityId: review.id,
        details: { action: 'REJECT', reason },
      }),
    );

    return saved;
  }

  async requestClarification(
    reviewId: string,
    consultantId: string,
    clarificationPrompt: string,
  ): Promise<ConsultantReview> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    review.status = ReviewStatus.CLARIFICATION_REQUESTED;
    review.consultantId = consultantId;
    review.consultantNotes = clarificationPrompt;

    const saved = await this.reviewRepo.save(review);

    await this.notifRepo.save(
      this.notifRepo.create({
        userId: review.applicantId,
        title: 'Clarification Requested by Educaro Consultant',
        message: clarificationPrompt,
        type: 'ACTION_REQUIRED',
      }),
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: consultantId,
        action: 'CONSULTANT_ACTION',
        entityType: 'CONSULTANT_REVIEW',
        entityId: review.id,
        details: { action: 'REQUEST_CLARIFICATION', clarificationPrompt },
      }),
    );

    return saved;
  }
}
