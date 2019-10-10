import { Module } from '@nestjs/common';
import { LabelsGateway } from './labels.gateway';
import { LabelsService } from './labels.service';
import { Label } from '../entities/label.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SegmentService } from './segment/segment.service';
import { Segment } from '../entities/segment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Label, Segment])],
  providers: [LabelsGateway, LabelsService, SegmentService],
  exports: [LabelsService, SegmentService],
})
export class LabelsModule {
}
