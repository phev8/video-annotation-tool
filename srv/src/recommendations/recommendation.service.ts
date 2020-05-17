import {HttpService, Injectable} from '@nestjs/common';
import {Project} from '../entities/project.entity';
import {PollerService} from '../labels/trackers/poller.service';
import {LabelsGateway} from '../labels/labels.gateway';
import {RecommendationDTO} from '../dto/recommendation.dto';
import {LabelsService} from '../labels/labels.service';
import {UsersService} from '../users/users.service';
import {UserModel} from '../users/user.model';
import {LabelCategoryDto} from '../dto/label.category.dto';
import {SegmentService} from '../labels/segment/segment.service';
import {LabelCategory} from '../entities/labelcategory.entity';
import {MarkerService} from '../labels/trackers/marker/marker.service';
import {TrackerController} from '../labels/trackers/tracker.controller';
import {config} from '../../config';
import {Segment} from '../entities/segment.entity';
import {InsertResult} from 'typeorm';
import { Label } from '../entities/label.entity';

@Injectable()
export class RecommendationService {
  constructor(
    private pollerService: PollerService,
    private httpService: HttpService,
    private labelsGateways: LabelsGateway,
    private labelsService: LabelsService,
    private usersService: UsersService,
    private segmentService: SegmentService,
    private markerService: MarkerService) {
  }

  async fetchYoloRecommendations(project: Project, trackerUrl: string) {
    const insertResult: InsertResult = await this.pollerService.createPoll(false);
    const pollId = insertResult.identifiers[0].id;
    if (!pollId) return null;
    console.log(
        'Created Poll id = ' + pollId + ' for Project: id - ' + project.id.toString() + '; name :' + project.title);
    const request = {filename: project.fileTree.children[0].filename};
    this.httpService.post(trackerUrl + '/video/recommend', request).subscribe(response => {
      if (response) {
        console.log(JSON.stringify(response.data));
        if (response.data && response.data != {} && !response.data.status) {
          const structuredResponse = this.processRecommendations(response.data, project);
          this.storeAnnotations(structuredResponse, project).then(response => {
            this.labelsGateways.triggerYoloGeneratedLabels(project.id.toString());
          });
        }
        this.pollerService.updatePoll(pollId.toString(), { completed: true}).then(result => {
          console.log('Poll completed : PollId - ' + pollId.toString());
        });
      }
    }, error => {
      this.predictionError(error, pollId.toString());
    });
    return pollId;
  }

  private predictionError(err, pollerId: string) {
    this.pollerService.updatePoll(pollerId, {completed: true, error: true, errorMessage: err}).then(result => {
      console.log(result);
    }, error => {
      console.log(error);
    });
  }

  /**
   * Method that converts the response from the video service recommendations to a
   * format easy to store as categories, labels, segments, markers and regions of interest.
   * @param recommendations
   * @param project
   */
   processRecommendations(recommendations: JSON, project: Project) {
    let samplingRate = 0;
    const processedResponse = {};
    let previousTime = 0;
    for (const time in recommendations) {
      if (recommendations[time]) {
        if (samplingRate === 0) samplingRate = parseInt(time, 10);
        const incomingTimeSlotData: RecommendationDTO = recommendations[time];
        // tslint:disable-next-line:only-arrow-functions
        incomingTimeSlotData.classes.forEach(function(value, index, array) {
          const responseKey = '' + time;
          if (processedResponse['' + value]) {
            RecommendationService.handleExistingLabelInResponse(processedResponse, value, previousTime, time, incomingTimeSlotData, index, responseKey);
          } else {
            RecommendationService.createNewLabelInResponse(time, incomingTimeSlotData, index, responseKey, processedResponse, value);
          }
        });
        previousTime = parseInt(time, 10);
        if (samplingRate === 0) samplingRate = parseInt(time, 10);
      }
    }
    processedResponse['samplingRate'] = samplingRate;
    return processedResponse;
  }

  private static handleExistingLabelInResponse(processedResponse, value, previousTime: number, time, incomingTimeSlotData: RecommendationDTO, index, responseKey) {
    const response = processedResponse['' + value][processedResponse['' + value].length - 1];
    // Section to handle labels that do not occur between consecutive time slots - Consecutive time slots: Separated by one samplingRate
    if (previousTime !== 0 && ((response.start > previousTime) || (previousTime > response.end))/*response.end !== previousTime */) {
      RecommendationService.processNonConsecutiveLabels(time, incomingTimeSlotData, index, responseKey, processedResponse, value);
    } else {
      RecommendationService.processConsecutiveLabels(response, time, responseKey, incomingTimeSlotData, index, processedResponse, value);
    }
  }

  private static createNewLabelInResponse(time, timeFrame: RecommendationDTO, index, responseKey, processedResponse, value) {
    const response = { start: parseInt(time, 10), end: parseInt(time, 10) };
    const regionsOfInterest = [];
    regionsOfInterest.push(timeFrame['bounding boxes'][index]);
    response[responseKey] = regionsOfInterest;
    processedResponse['' + value] = [response];
  }

  private static processConsecutiveLabels(response, time, responseKey, timeFrame: RecommendationDTO, index, processedResponse, value) {
    response.end = parseInt(time, 10);
    const regionsOfInterest = response[responseKey] ? response[responseKey] : [];
    regionsOfInterest.push(timeFrame['bounding boxes'][index]);
    response[responseKey] = regionsOfInterest;
    processedResponse['' + value][processedResponse['' + value].length - 1] = response;
  }

  private static processNonConsecutiveLabels(time, timeFrame: RecommendationDTO, index, responseKey, processedResponse, value) {
    const timeSegment = { start: parseInt(time, 10), end: parseInt(time, 10) };
    const regionsOfInterest = [];
    regionsOfInterest.push(timeFrame['bounding boxes'][index]);
    timeSegment[responseKey] = regionsOfInterest;
    processedResponse['' + value].push(timeSegment);
  }

  /**
   * Store the processed recommendation response into the database.
   * @param structuredResponse
   * @param project
   */
  async storeAnnotations(structuredResponse: {}, project: Project) {
    const systemUser = await this.getSystemUser();
    const samplingRate = structuredResponse['samplingRate'];
    for (const key in structuredResponse) {
      if (key  === 'samplingRate') continue;
      const labelCategory: LabelCategoryDto = new LabelCategoryDto(key, true, systemUser[0].id.toString(), structuredResponse['samplingRate'], 'ms');
      let category = await this.labelsService.createSystemGeneratedLabelCategory(project.id.toString(), systemUser[0].id.toString(), 'contributor', labelCategory);
        // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < structuredResponse[key].length; j++) {
        const predictedCategoryInstanceInfo = structuredResponse[key][j];
        for (const trackingKey in structuredResponse[key][j]) {
          const seenLabels = {};
          if (trackingKey === 'start' || trackingKey === 'end') continue;
          if (structuredResponse[key][j].hasOwnProperty(trackingKey)) {
            for (const labelInstance in structuredResponse[key][j][trackingKey]) {
              if (structuredResponse[key][j][trackingKey].hasOwnProperty(labelInstance)) {
                const timeslot = parseInt(trackingKey, 10);
                const labelId = (await this.getLabelToUpdate(category, seenLabels, project.id.toString(), systemUser[0].id.toString())).id.toString(); // category.labels[0]['_id'].toString()
                const segmentIdentifier = await this.getSegmentForLabel(labelId, timeslot, systemUser, samplingRate);
                category = await this.labelsService.getLabelCategory(category.id.toString());
                if (!await this.markerService.findMarkerByTime(segmentIdentifier, timeslot)) {
                  const response = await this.markerService.addMarker({ completed: true, start: timeslot, labelId,
                    authorId: systemUser[0].id.toString(), authorClass: 'contributor', segmentId: segmentIdentifier });
                  const marker = await this.markerService.getMarker(response.insertedId.toString());
                  const tracker = await this.markerService.getTracker(marker.trackerId.toString());
                  const body = {authorId: systemUser[0].id.toString(), trackerType: 'rect', authorClass: 'contributor', labelName: category.labels[labelInstance].name,
                    trackables: RecommendationService.generateRecommendedTrackables(structuredResponse[key][j][trackingKey][labelInstance], project.videoDimensions, category.labels[labelInstance].name)};
                  tracker.selectedColor = config.systemColor;
                  tracker.firstUpdate = false;
                  TrackerController.setTrackerFields(tracker, body);
                  await this.markerService.updateTracker(tracker.id.toString(), tracker);
                }
              }
            }
          }
        }
      }
    }
    console.log('Recommendation Completed');
    return true;
  }

  private async getSegmentForLabel(labelId, trackingKey, systemUser, samplingRate) {
    const preExistingSegment: Segment = await this.segmentService.findCoincidingSegment(labelId, Number(trackingKey), Number(trackingKey), systemUser[0].id.toString(), samplingRate);
    let segmentIdentifier;
    if (preExistingSegment) {
      await this.segmentService.updateSegment(preExistingSegment.id.toString(), preExistingSegment['start'], RecommendationService.getEnd(Number(trackingKey), samplingRate));
      segmentIdentifier = preExistingSegment.id.toString();
    } else {
      const insertResult = await this.segmentService.createSegment(labelId, systemUser[0].id.toString(), RecommendationService.getStart(Number(trackingKey), samplingRate), RecommendationService.getEnd(Number(trackingKey), samplingRate), 'contributor');
      segmentIdentifier = insertResult.identifiers[0].id.toString();
    }
    return segmentIdentifier;
  }

  private async getSystemUser() {
    let systemUser = await this.usersService.findByUsername(config.systemUserName);
    if (!systemUser || systemUser.length === 0) {
      await this.usersService.create(new UserModel(config.systemUserName, config.systemUserEmail, config.systemUserPwd));
      systemUser = await this.usersService.findByUsername(config.systemUserName);
    }
    return systemUser;
  }

  private static getStart(startTime, samplingRate: any) {
    const start = startTime - Math.round(samplingRate / 2);
    return start <= 0 ? 0 : start;
  }

  private static getEnd(endTime, samplingRate) {
    return endTime + Math.round(samplingRate / 2);
  }

  private static generateRecommendedTrackables(trackingInfo: number[], videoDimensions: string, labelName: string) {
    // Note: trackinfo normally contains values like [[0.4466145833333333,0.3958333333333333,0.15963541666666667,0.34629629629629627]]
    // array of dimensions where each dimension is of the type [x, y, width, height] in ratios
    const regionOfInterest = [];
    const screenWidth = parseInt(videoDimensions.split(' ')[1], 10);
    const screenHeight = parseInt(videoDimensions.split(' ')[0], 10);
    const dimension = trackingInfo;
    // @ts-ignore
    const [x, y, width, height]: number[] = [ dimension[0] * screenWidth, dimension[1] * screenHeight, dimension[2] * screenWidth, dimension[3] * screenHeight];
    regionOfInterest.push("\"<rect id=\\\""+labelName+"\\\" fill=\\\""+config.systemColor+"\\\" fill-opacity=\\\"0.3\\\" shape-rendering=\\\"geometricPrecision\\\" stroke-linejoin=\\\"round\\\" stroke=\\\"#000000\\\" x=\\\""+
        x+"\\\" y=\\\""+y+"\\\" width=\\\""+width+"\\\" height=\\\""+height+"\\\" title=\\\""+labelName+"\\\"><title>"+labelName+"</title></rect>\"");
    return regionOfInterest;
  }

  async fetchPollStatus(id: string) {
    return this.pollerService.findPoll(id);
  }

  async removePoll(poll_Id: string) {
    return this.pollerService.removePoll(poll_Id);
  }

  /**
   * Method to create or retrieve an appropriate label instance. i.e, 4th instance for the fourth occurence of a label.
   * @param category
   * @param labelTracker
   */
  async getLabelToUpdate(category: LabelCategory, labelTracker: {}, projectId: string, authorId: string) {
    if (!labelTracker[category.name] && labelTracker[category.name] !== 0) {
      labelTracker[category.name] = 0;
      return await this.labelsService.getLabel(category.labels[labelTracker[category.name]]['_id'].toString());
    }
    labelTracker[category.name] += 1;
    if (category.labels[labelTracker[category.name]]) {
      return await this.labelsService.getLabel(category.labels[labelTracker[category.name]]['_id'].toString());
    } else {
      const label: Label = await this.labelsService.createLabel(projectId, authorId, category.id.toString(), 'contributor');
      return label;
    }
  }
}
