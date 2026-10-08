import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';
import {
  Opportunity,
  OpportunityMatch,
  ApplicantProfile,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Opportunity,
      OpportunityMatch,
      ApplicantProfile,
    ]),
  ],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
