import { Module, MulterModule } from '@nestjs/common';
import { LabelsGateway } from './labels.gateway';
import { LabelsService } from './labels.service';
import { Label } from '../entities/label.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SegmentService } from './segment/segment.service';
import { Segment } from '../entities/segment.entity';
import { LabelCategory } from '../entities/labelcategory.entity';
import { Marker } from '../entities/markers.entity';
import { MarkerService } from './trackers/marker/marker.service';
import { Tracker } from '../entities/tracker.entity';
import { TrackerController } from './trackers/tracker.controller';
import { PassportModule } from '@nestjs/passport';
import { config } from '../../config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Label, Segment, LabelCategory, Marker, Tracker]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({
      dest: config.multerDest,
    }),
  ],
  providers: [LabelsGateway, LabelsService, SegmentService, MarkerService],
  controllers: [TrackerController],
  exports: [LabelsService, SegmentService, MarkerService],
})
export class LabelsModule {
}
