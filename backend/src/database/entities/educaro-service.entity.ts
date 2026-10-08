import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoutingRule } from './routing-rule.entity';

@Entity('educaro_services')
export class EducaroService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // e.g. "Educaro Fast-Track German Language Academy", "APS & Document Verification Suite"

  @Column()
  category: string; // LANGUAGE_PREPARATION, DOCUMENT_VERIFICATION, PATHWAY_COUNSELING, APPLICATION_SUPPORT

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb' })
  entryCriteria: {
    minLanguageLevel?: string;
    targetPathways?: string[];
    requiredReadinessScore?: number;
  };

  @Column({ type: 'simple-array', nullable: true })
  benefits: string[];

  @Column({ nullable: true })
  fee: string; // e.g. "Included in Educaro Program" or specific fee

  @Column({ nullable: true })
  duration: string; // e.g. "12 Weeks", "Flexible"

  @Column({ default: true })
  isDemoData: boolean;

  @OneToMany(() => RoutingRule, (rule) => rule.targetService)
  routingRules: RoutingRule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
