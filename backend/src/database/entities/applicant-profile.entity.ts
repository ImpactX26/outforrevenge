import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { GoalType } from '../../common/enums';
import { User } from './user.entity';
import { Education } from './education.entity';
import { Employment } from './employment.entity';
import { Skill } from './skill.entity';
import { Language } from './language.entity';

@Entity('applicant_profiles')
export class ApplicantProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: GoalType,
    nullable: true,
  })
  currentGoal: GoalType;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  availability: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'int', default: 0 })
  profileCompleteness: number;

  @Column({ type: 'int', default: 0 })
  readinessScore: number;

  @Column({ type: 'text', nullable: true })
  rawMotivation: string;

  @Column({ type: 'simple-array', nullable: true })
  preferredPathways: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Education, (edu) => edu.profile, { cascade: true })
  educations: Education[];

  @OneToMany(() => Employment, (emp) => emp.profile, { cascade: true })
  employments: Employment[];

  @OneToMany(() => Skill, (sk) => sk.profile, { cascade: true })
  skills: Skill[];

  @OneToMany(() => Language, (lang) => lang.profile, { cascade: true })
  languages: Language[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
