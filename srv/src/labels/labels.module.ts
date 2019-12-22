import { Module } from '@nestjs/common';
import { LabelsGateway } from './labels.gateway';
import { LabelsService } from './labels.service';
import { Label } from '../entities/label.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SegmentService } from './segment/segment.service';
import { Segment } from '../entities/segment.entity';
import { LabelCategory } from '../entities/labelcategory.entity';
import { Marker } from '../entities/markers.entity';
import { MarkerService } from './trackers/marker/marker.service';

@Module({
  imports: [TypeOrmModule.forFeature([Label, Segment, LabelCategory, Marker])],
  providers: [LabelsGateway, LabelsService, SegmentService, MarkerService],
  exports: [LabelsService, SegmentService, MarkerService],
})
export class LabelsModule {
}
