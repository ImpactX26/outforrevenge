import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';

@Entity('document_extractions')
export class DocumentExtraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string;

  @OneToOne(() => Document, (doc) => doc.extraction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'text', nullable: true })
  rawText: string;

  @Column({ type: 'jsonb' })
  extractedJson: Record<string, any>;

  @Column({ type: 'float', default: 0.9 })
  confidence: number;

  @Column({ type: 'jsonb', nullable: true })
  warnings: string[];

  @Column({ type: 'jsonb', nullable: true })
  provenance: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
