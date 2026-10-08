import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { DefaultSpeechToTextService } from './stt/default-speech-to-text.service';
import { SPEECH_TO_TEXT_PROVIDER_TOKEN } from './stt/speech-to-text.interface';
import {
  Video,
  VideoAnalysis,
  ApplicantProfile,
  Skill,
  AuditLog,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Video,
      VideoAnalysis,
      ApplicantProfile,
      Skill,
      AuditLog,
    ]),
  ],
  controllers: [VideosController],
  providers: [
    DefaultSpeechToTextService,
    {
      provide: SPEECH_TO_TEXT_PROVIDER_TOKEN,
      useClass: DefaultSpeechToTextService,
    },
    VideosService,
  ],
  exports: [VideosService, SPEECH_TO_TEXT_PROVIDER_TOKEN],
})
export class VideosModule {}
