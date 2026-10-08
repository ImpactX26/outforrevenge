import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OpportunityType } from '../../common/enums';
import { OpportunityMatch } from './opportunity-match.entity';

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: OpportunityType,
  })
  type: OpportunityType;

  @Column()
  organization: string; // University or Company or Training Provider

  @Column()
  location: string; // City, Germany

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb' })
  requirements: {
    minGermanLevel?: string;
    minEnglishLevel?: string;
    educationField?: string[];
    minExperienceMonths?: number;
    skillsRequired?: string[];
  };

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  deadline: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ default: true })
  isDemoData: boolean;

  @OneToMany(() => OpportunityMatch, (m) => m.opportunity)
  matches: OpportunityMatch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
