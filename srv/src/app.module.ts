import { Module } from '@nestjs/common';
import { LabelsModule } from './labels/labels.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';
import { UsersModule } from './users/users.module';
import { Project } from './entities/project.entity';
import { User } from './entities/user.entity';
import { Label } from './entities/label.entity';
import { Segment } from './entities/segment.entity';
import { config } from '../config';

@Module({
  imports: [
    TypeOrmModule.forRoot(config.typeOrmConfig),
    AuthModule,
    UsersModule,
    ProjectModule,
    LabelsModule,
  ],
})
export class ApplicationModule {
}
