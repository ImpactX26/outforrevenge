import { Injectable } from '@nestjs/common';
import { ApplicantProfile } from '../../database/entities/applicant-profile.entity';
import { Document } from '../../database/entities/document.entity';
import { Video } from '../../database/entities/video.entity';
import { AiService } from '../../ai/ai.service';

export interface MissingInfoItem {
  field: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  question: string;
  reason: string;
}

@Injectable()
export class MissingInfoAgent {
  constructor(private readonly aiService: AiService) {}

  async detectGaps(
    profile: ApplicantProfile,
    documents: Document[],
    videos: Video[],
    parentExecutionId?: string,
  ): Promise<MissingInfoItem[]> {
    const gaps: MissingInfoItem[] = [];

    // 1. Language gaps
    const hasGerman = profile.languages?.some((l) => l.language.toLowerCase().includes('german'));
    if (!hasGerman) {
      gaps.push({
        field: 'German Language Proficiency',
        category: 'LANGUAGE',
        priority: 'HIGH',
        question: 'What is your current German language level (A1, A2, B1, B2, C1, or none)?',
        reason: 'German proficiency is required for all Ausbildung pathways and advantageous for visas.',
      });
    }

    // 2. Education documents
    const hasEduDoc = documents.some((d) => d.documentType === 'DEGREE' || d.documentType === 'TRANSCRIPT');
    if (!hasEduDoc && (!profile.educations || profile.educations.length === 0)) {
      gaps.push({
        field: 'Degree Certificate / 12th Marksheet',
        category: 'EDUCATION',
        priority: 'HIGH',
        question: 'Please upload your official University Degree or Higher Secondary School marksheet.',
        reason: 'Academic credentials are essential for Anabin H+ equivalency verification in Germany.',
      });
    }

    // 3. Availability & Location
    if (!profile.location) {
      gaps.push({
        field: 'Current Location in India',
        category: 'PERSONAL',
        priority: 'MEDIUM',
        question: 'Which city in India are you currently residing in?',
        reason: 'Determines the relevant German Consulate jurisdiction (Mumbai, New Delhi, Bengaluru, Chennai).',
      });
    }

    // 4. Video introduction
    if (videos.length === 0) {
      gaps.push({
        field: '60-Second Video Introduction',
        category: 'MEDIA',
        priority: 'MEDIUM',
        question: 'Have you recorded your 60-second video introduction?',
        reason: 'Accelerates partner employer and university screening.',
      });
    }

    return gaps;
  }
}
