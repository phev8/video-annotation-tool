import { Module, MulterModule } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { Project } from '../entities/project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { PassportModule } from '@nestjs/passport';
import { LabelsModule } from '../labels/labels.module';
import { config } from '../../config';
import {RecommendationService} from "../recommendations/recommendation.service";
import {RecommendationModule} from "../recommendations/recommendation.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({
      dest: config.multerDest,
    }),
    LabelsModule,
      RecommendationModule
  ],
  controllers: [ProjectController],
  providers: [ProjectService, RecommendationService],
  exports: [ProjectService, RecommendationService],
})
export class ProjectModule {
}
