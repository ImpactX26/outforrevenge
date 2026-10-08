import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Opportunity } from './opportunity.entity';

@Entity('opportunity_matches')
export class OpportunityMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicantId: string;

  @ManyToOne(() => User, (u) => u.opportunityMatches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column()
  opportunityId: string;

  @ManyToOne(() => Opportunity, (o) => o.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunityId' })
  opportunity: Opportunity;

  @Column({ type: 'int' })
  matchPercentage: number; // 0-100

  @Column({ type: 'jsonb' })
  matchedRequirements: string[];

  @Column({ type: 'jsonb' })
  missingRequirements: string[];

  @Column({ type: 'text' })
  reason: string;

  @Column({ nullable: true })
  nextAction: string;

  @CreateDateColumn()
  createdAt: Date;
}
