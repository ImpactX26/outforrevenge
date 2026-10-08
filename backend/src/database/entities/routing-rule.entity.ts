import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RecommendationType } from '../../common/enums';
import { EducaroService } from './educaro-service.entity';

@Entity('routing_rules')
export class RoutingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g. "Missing German B1 -> Route to Educaro Language Academy"

  @Column()
  conditionType: string; // e.g. "MISSING_LANGUAGE", "UNRESOLVED_INCONSISTENCY", "QUALIFIED_READY", "MISSING_DOCUMENTS"

  @Column({ type: 'jsonb' })
  conditionExpression: {
    pathway?: string;
    missingRequirementCode?: string;
    hasInconsistency?: boolean;
    minReadinessScore?: number;
    maxReadinessScore?: number;
  };

  @Column({
    type: 'enum',
    enum: RecommendationType,
  })
  targetType: RecommendationType;

  @Column({ nullable: true })
  targetServiceId: string;

  @ManyToOne(() => EducaroService, (s) => s.routingRules, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'targetServiceId' })
  targetService: EducaroService;

  @Column({ type: 'int', default: 10 })
  priority: number; // Higher number = higher precedence

  @Column({ type: 'text' })
  reasonTemplate: string;

  @Column({ default: true })
  isDemoData: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
