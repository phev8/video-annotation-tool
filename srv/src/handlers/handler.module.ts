import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import {ErrorhandlerService} from "./errorhandler.service";

@Module({
  imports: [
  ],
  controllers: [],
  providers: [ErrorhandlerService],
  exports: [ErrorhandlerService],
})
export class HandlerModule {

}
