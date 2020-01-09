 import {
  Body,
  Controller,
  Delete,
  FilesInterceptor,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
 import { MarkerService } from './marker/marker.service';
 import { LabelsService } from '../labels.service';
 import { SegmentService } from '../segment/segment.service';
 import { AuthGuard } from '@nestjs/passport';
 import { Tracker } from '../../entities/tracker.entity';
 import { Project } from '../../entities/project.entity';
 import { User } from '../../entities/user.entity';


@Controller('tracker')
export class TrackerController {

  constructor(private markerService: MarkerService,
              private labelsService: LabelsService,
              private segmentsService: SegmentService) {
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  async findOne(@Param('id') id) {
    return this.markerService.getTracker(id).then((tracker: Tracker) => {
      return tracker;
      }, function(err) {
      console.log(err);
      return null;
    });
  }

  @Put('/update/:id')
  @UseGuards(AuthGuard())
  async update(@Param('id') id, @Body() body) {
    let tracker = await this.markerService.getTracker(id);
    if (body && body['trackables']) {
      tracker.authorId = body['authorId'];
      tracker.trackables = body['trackables'];
      tracker.trackerType = body['trackerType'];
      tracker.authorClass = body['authorClass'];
      if(tracker.firstUpdate) {
        await this.markerService.autoUpdateTrackers(tracker).catch(function(error) {
          console.log("error: "+ error);
        });
      }
      tracker.firstUpdate = false;
      return await this.markerService.updateTracker(id, tracker);
    }
  }
}
