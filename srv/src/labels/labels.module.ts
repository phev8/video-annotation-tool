import {HttpModule, HttpService, Module, MulterModule} from '@nestjs/common';
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
import {ObjectTrackingService} from "./trackers/object.tracking.service";
import {Pollingstatus} from "../entities/pollingstatus.entity";
import {PollerService} from "./trackers/poller.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Label, Segment, LabelCategory, Marker, Tracker, Pollingstatus]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({
      dest: config.multerDest,
    }),
    HttpModule
  ],
  providers: [LabelsGateway, LabelsService, SegmentService, MarkerService, ObjectTrackingService, PollerService],
  controllers: [TrackerController],
  exports: [LabelsService, SegmentService, MarkerService, ObjectTrackingService, PollerService, LabelsGateway],
})
export class LabelsModule {
}
