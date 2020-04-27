import {HttpService, Injectable} from '@nestjs/common';
import {Project} from '../entities/project.entity';
import {PollerService} from "../labels/trackers/poller.service";
import {LabelsGateway} from "../labels/labels.gateway";
import {RecommendationDTO} from "../dto/recommendation.dto";
import {LabelsService} from "../labels/labels.service";
import {UsersService} from "../users/users.service";
import {UserModel} from "../users/user.model";
import {LabelCategoryDto} from "../dto/label.category.dto";
import {SegmentService} from "../labels/segment/segment.service";
import {LabelCategory} from "../entities/labelcategory.entity";
import {MarkerService} from "../labels/trackers/marker/marker.service";
import {TrackerController} from "../labels/trackers/tracker.controller";
import {config} from "../../config";
import {Segment} from "../entities/segment.entity";
import {InsertResult} from "typeorm";

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
    this.pollerService.createPoll(false).then(result => {
      const poller_Id = result.identifiers[0].id;
      console.log(
          "Created Poll id = " + poller_Id.toString()+ " for Project: id - "+ project.id.toString() + "; name :"+ project.title);
      const request = {filename: project.fileTree.children[0].filename};
      this.httpService.post(trackerUrl + '/video/recommend', request).subscribe(response => {
        if (response) {
          console.log(JSON.stringify(response.data));
          if(response.data && response.data != {} && !response.data.status) {
            let structuredResponse = this.processRecommendations(response.data, project);
            this.storeAnnotations(structuredResponse, project).then(response => {
              this.labelsGateways.triggerYoloGeneratedLabels(project.id.toString());
            });
          }
          this.pollerService.updatePoll(poller_Id, { completed: true}).then(result => {
            console.log('Poll completed : PollId - ' + poller_Id);
          });
        }
      }, error => {
        this.predictionError(error, poller_Id.toString());
      });
    }, error => {
      console.log("Failed to create Poll for Project: id - "+ project.id.toString() + "; name :"+ project.title);
    });
  }

  private predictionError(err, pollerId: string) {
    this.pollerService.updatePoll(pollerId, {completed: true, error: true, errorMessage: err}).then(result => {
      console.log(result)
    }, err => {
      console.log(err);
    });
  }

  private processRecommendations(recommendations: JSON, project: Project) {
    let samplingRate = 0;
    let processedResponse = {};
    let previousTime = 0;
    for (let time in recommendations) {
      if(samplingRate == 0) samplingRate = parseInt(time);
      let timeFrame: RecommendationDTO = recommendations[time];
      timeFrame.classes.forEach(function (value, index, array) {
        let responseKey = "" + time;
        if(processedResponse[""+value]) {
          let response = processedResponse[""+value][processedResponse[""+value].length -1 ];
          if(previousTime!= 0 && response.end != previousTime) {
            let response = {start: parseInt(time), end: parseInt(time)};
            let trackingData = [];
            trackingData.push(timeFrame["bounding boxes"][index]);
            response[responseKey] = trackingData;
            processedResponse["" + value].push(response);
          } else {
            response.end = parseInt(time);
            let trackingData = response[responseKey]? response[responseKey]: [];
            trackingData.push(timeFrame["bounding boxes"][index]);
            response[responseKey] = trackingData;
            processedResponse["" + value][processedResponse[""+value].length -1 ] = response;
          }
        } else {
          let response = {start: parseInt(time), end: parseInt(time)};
          let trackingData = [];
          trackingData.push(timeFrame["bounding boxes"][index]);
          response[responseKey] = trackingData;
          processedResponse["" + value] = [response];
        }
      });
      previousTime = parseInt(time);
      if(samplingRate == 0) samplingRate = parseInt(time);
    }
    processedResponse["samplingRate"] = samplingRate;
    return processedResponse;
  }

  async storeAnnotations(structuredResponse: {}, project: Project) {
    let systemUser = await this.usersService.findByUsername("systemrecommendation");
    if(!systemUser || systemUser.length == 0) {
      await this.usersService.create(new UserModel("systemrecommendation", "system.recommendation@system.com", "sys123"));
      systemUser = await this.usersService.findByUsername("systemrecommendation");
    }
    const samplingRate = structuredResponse["samplingRate"];
    for(let key in structuredResponse) {
      if(key  == "samplingRate") continue;
      let labelCategory : LabelCategoryDto = new LabelCategoryDto(key, true, systemUser[0].id.toString(), structuredResponse["samplingRate"], "ms");
      let createdItem = await this.labelsService.createSystemGeneratedLabelCategory(project.id.toString(),systemUser[0].id.toString(), "contributor", labelCategory);
      if(createdItem instanceof LabelCategory) {
          for(let j = 0; j < structuredResponse[key].length; j++) {
            let item = structuredResponse[key][j];
            let labelId = createdItem.labels[0]["_id"].toString();
            //TODO FIX SEGMENT START AND END AT THE SAME TIME
            let preExistingSegment: Segment = await this.segmentService.findCoincidingSegment(labelId,item["start"], item["end"], systemUser[0].id.toString(), samplingRate);
            let segmentIdentifier;
            if(preExistingSegment) {
              await this.segmentService.updateSegment(preExistingSegment.id.toString(), preExistingSegment["start"], RecommendationService.getEnd(item, samplingRate));
              segmentIdentifier = preExistingSegment.id.toString();
            } else {
              let insertResult = await this.segmentService.createSegment(labelId, systemUser[0].id.toString(), RecommendationService.getStart(item, samplingRate), RecommendationService.getEnd(item, samplingRate), "contributor");
              segmentIdentifier = insertResult.identifiers[0].id.toString();
            }
            if(segmentIdentifier) {
              for(const trackingKey in structuredResponse[key][j]) {
                if(trackingKey == "start" || trackingKey == "end") continue;
                let timeslot = parseInt(trackingKey);
                if(!await this.markerService.findMarkerByTime(segmentIdentifier, timeslot)) {
                  let response = await this.markerService.addMarker({ completed: true, start: timeslot, labelId: labelId,
                    authorId: systemUser[0].id.toString(), authorClass: "contributor", segmentId: segmentIdentifier });
                  let marker = await this.markerService.getMarker(response.insertedId.toString());
                  let tracker = await this.markerService.getTracker(marker.trackerId.toString());
                  let body = {"authorId": systemUser[0].id.toString(), "trackerType": "rect","authorClass": "contributor", "labelName": createdItem.labels[0].name,
                          "trackables": this.generateRecommendedTrackables(structuredResponse[key][j][trackingKey], project.videoDimensions, createdItem.labels[0].name)};
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
    console.log("Recommendation Completed");
    return true;
  }

  private static getStart(item, samplingRate: any) {
    const start = item["start"] - Math.round(samplingRate / 2);
    return start<=0? 0 : start;
  }

  private static getEnd(item, samplingRate) {
    return item["end"] + Math.round(samplingRate / 2);
  }

  private generateRecommendedTrackables(trackingInfo: [number[]], videoDimensions: string, labelName: string) {
    // Note: trackinfo normally contains values like [[0.4466145833333333,0.3958333333333333,0.15963541666666667,0.34629629629629627]]
    // array of dimensions where each dimension is of the type [x, y, width, height] in ratios
    let trackables = [];
    let screenWidth = parseInt(videoDimensions.split(" ")[1]);
    let screenHeight = parseInt(videoDimensions.split(" ")[0]);
    for(let tracker in trackingInfo) {
      let dimension = trackingInfo[tracker];
      const [x, y, width, height]: number[] = [dimension[0]*screenWidth, dimension[1]*screenHeight,
        dimension[2]*screenWidth, dimension[3]*screenHeight];
      trackables.push("\"<rect id=\\\""+labelName+"\\\" fill=\\\""+config.systemColor+"\\\" fill-opacity=\\\"0.3\\\" shape-rendering=\\\"geometricPrecision\\\" stroke-linejoin=\\\"round\\\" stroke=\\\"#000000\\\" x=\\\""+
          x+"\\\" y=\\\""+y+"\\\" width=\\\""+width+"\\\" height=\\\""+height+"\\\" title=\\\""+labelName+"\\\"><title>"+labelName+"</title></rect>\"");
    }
    return trackables;
  }

  async fetchPollStatus(id: string) {
    return this.pollerService.findPoll(id);
  }
}
