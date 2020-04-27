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
 import {Pollingstatus} from "../../entities/pollingstatus.entity";
 import {PollerService} from "./poller.service";


@Controller('tracker')
export class TrackerController {

  constructor(private markerService: MarkerService,
              private labelsService: LabelsService,
              private segmentsService: SegmentService,
              private trackerService: ObjectTrackingService,
              private pollerService: PollerService) {
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
    let poll_id = '';
    let tracker = await this.markerService.getTracker(id);
    if (body && body['trackables']) {
      TrackerController.setTrackerFields(tracker, body);
      if(tracker.selectedColor != body['selectedColor']) {
        await this.markerService.updateTrackerColor(tracker.labelId, body['selectedColor']).catch(function(error) {
          console.log("Updating Tracker Color Error: "+ error);
        });
      }
      tracker.selectedColor = body['selectedColor'];
      //if(tracker.firstUpdate) {
        poll_id = await this.autoUpdateTrackingData(tracker, body['videoDimensions'], body['filename']);
      //}
      tracker.firstUpdate = false;
      await this.markerService.updateTracker(id, tracker);
    }
    return poll_id;
  }

  @Get('/polling/:id')
  @UseGuards(AuthGuard())
  async pollStatus(@Param('id') id) {
    let polling_status = await this.pollerService.findPoll(id);
    if(polling_status) {
      return JSON.stringify({ completed: polling_status.completed, polling_id: id});
    }
    return JSON.stringify({ completed: true, polling_id: id, error: polling_status.error, errorMessage: polling_status.errorMessage});
  }

  static setTrackerFields(tracker: Tracker, body) {
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
      const poller_Id = (await this.pollerService.createPoll(false)).identifiers[0].id;
      (await this.trackerService.trackObjects(tracker, '', videoDimensions.split(" "), filename, timeInfo)).subscribe(resp => {
          if (resp) {
            //TODO Handle different error codes from video analyzer microservice
            console.log(JSON.stringify(resp.data));
            this.markerService.updateTrackerPrediction(tracker, resp.data, timeInfo.markers).then(completed => {
              console.log(completed);
              this.pollerService.updatePoll(poller_Id, { completed: true}).then(result => {
                console.log('');
              });
            });
          }
      }, error => {
        this.predictionError(error, poller_Id.toHexString());
      });
      return poller_Id;
    }
    return ''
  }

  private predictionError(err, pollerId: string) {
    this.pollerService.updatePoll(pollerId, {completed: true, error: true, errorMessage: err}).then(result => {
      console.log(result)
    }, err => {
      console.log(err);
    });
  }


}
