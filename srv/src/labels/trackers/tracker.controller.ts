 import {
  Body,
  Controller,
  Delete,
  FilesInterceptor,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
 import { MarkerService } from './marker/marker.service';
 import { LabelsService } from '../labels.service';
 import { SegmentService } from '../segment/segment.service';
 import { AuthGuard } from '@nestjs/passport';
 import { Tracker } from '../../entities/tracker.entity';
 import {ObjectTrackingService} from "./object.tracking.service";


@Controller('tracker')
export class TrackerController {

  constructor(private markerService: MarkerService,
              private labelsService: LabelsService,
              private segmentsService: SegmentService,
              private trackerService: ObjectTrackingService) {
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
      TrackerController.setTrackerFields(tracker, body);
      if(tracker.selectedColor != body['selectedColor']) {
        await this.markerService.updateTrackerColor(tracker.labelId, body['selectedColor']).catch(function(error) {
          console.log("Updating Tracker Color Error: "+ error);
        });
      }
      tracker.selectedColor = body['selectedColor'];
      if(tracker.firstUpdate) {
        await this.autoUpdateTrackingData(tracker, body['videoDimensions'], body['filename']);
      }
      tracker.firstUpdate = false;
      return await this.markerService.updateTracker(id, tracker);
    }
  }

  private static setTrackerFields(tracker: Tracker, body) {
    tracker.authorId = body['authorId'];
    tracker.trackables = body['trackables'];
    tracker.trackerType = body['trackerType'];
    tracker.authorClass = body['authorClass'];
    tracker.labelName = body['labelName'];
  }

  private async autoUpdateTrackingData(tracker: Tracker, videoDimensions: string, filename: string) {
    await this.markerService.autoUpdateTrackers(tracker).catch(function (error) {
      console.log("error: " + error);
    });
    if(tracker.trackerType == 'rect') {
      const timeInfo = await this.markerService.findTimesForTracking(tracker.markerId);
      (await this.trackerService.trackObjects(tracker, '', videoDimensions.split(" "), filename, timeInfo)).subscribe(resp => {
          if (resp) {
            console.log(resp.data);
            this.markerService.updateTrackerPrediction(tracker, resp.data, timeInfo.markers).then(completed => {
              console.log('ready for user confirmation');
            });
          }
      }, function (err) {
        console.log('ERROR: ' + err);
      });
    }
  }
}
