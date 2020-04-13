import { Module, MulterModule } from '@nestjs/common';
import { Project } from '../entities/project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationService } from './recommendation.service';
import { PassportModule } from '@nestjs/passport';
import { LabelsModule } from '../labels/labels.module';
import { config } from '../../config';
import {Label} from "../entities/label.entity";
import {Segment} from "../entities/segment.entity";
import {LabelCategory} from "../entities/labelcategory.entity";
import {Marker} from "../entities/markers.entity";
import {Tracker} from "../entities/tracker.entity";
import {Pollingstatus} from "../entities/pollingstatus.entity";
import {PollerService} from "../labels/trackers/poller.service";
import {UsersService} from "../users/users.service";
import {User} from "../entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User, Label, Segment, LabelCategory, Marker, Tracker, Pollingstatus]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({
      dest: config.multerDest,
    }),
    LabelsModule,
  ],
  controllers: [],
  providers: [RecommendationService, PollerService, UsersService],
  exports: [RecommendationService, PollerService, UsersService],
})
export class RecommendationModule {
}
