import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GoalType } from '../../common/enums';

@Entity('qualification_requirements')
export class QualificationRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  pathway: GoalType;

  @Column()
  category: string; // e.g. LANGUAGE, EDUCATION, EXPERIENCE, DOCUMENT

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  ruleCode: string; // e.g. GERMAN_B1, RECOGNIZED_BACHELOR, MIN_EXPERIENCE_1YR

  @Column({ nullable: true })
  minimumLevel: string; // e.g. B1, B2, 60%, 2.5

  @Column({ default: true })
  required: boolean;

  @Column({ type: 'int', default: 10 })
  weight: number;

  @Column({ default: true })
  isDemoData: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
