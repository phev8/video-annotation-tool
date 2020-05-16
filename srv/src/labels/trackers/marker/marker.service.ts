import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { Marker } from '../../../entities/markers.entity';
import { Tracker } from '../../../entities/tracker.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { TrackerResult } from '../../../interfaces/tracker.result';
import { RectangleTracker } from '../../../interfaces/rectangle.tracker';
import { CircleTracker } from '../../../interfaces/circle.tracker';
import { PolyTracker } from '../../../interfaces/poly.tracker';
import { Point } from '../../../interfaces/point';
import {parseString} from 'xml2js'


@Injectable()
export class MarkerService {
  constructor(@InjectRepository(Marker)
              private readonly markerRepository: MongoRepository<Marker>,
              @InjectRepository(Tracker)
              private readonly trackerRepository: MongoRepository<Tracker>) {
  }

  async getMarkers(labelId: string) {
    return await this.markerRepository.find({ where: { labelId } });
  }

  async getTrackers(labelId: string) {
    return await this.trackerRepository.find({ where: { labelId } });
  }

  async getTracker(id: string): Promise<Tracker> {
    return await this.trackerRepository.findOne(id);
  }

  async getMarker(id: string): Promise<Marker> {
    return await this.markerRepository.findOne(id);
  }

  async addMarker(marker: { completed: boolean; start: number; labelId: any; authorId: string; authorClass: string, segmentId: any }) {
    let markers: Marker[] = await this.markerRepository.find({ where: {segmentId: marker.segmentId, start: marker.start} });
    if(markers && markers.length == 0) {
      let trackerId  = await this.trackerRepository.insertOne(new Tracker(marker.labelId, marker.segmentId));
      return await this.markerRepository.insertOne(new Marker(marker.labelId, marker.authorId, marker.start, marker.authorClass, marker.completed, trackerId.insertedId.toString(), marker.segmentId));
    }
    return;
  }

  async findMarkers(ids: any[]) {
    return await this.markerRepository.findByIds(ids);
  }

  async findMarkerByTime(segmentId: string, start: number) {
    let markers: Marker[] =  await this.markerRepository.find({ where: { segmentId } });
    for(let i=0; i< markers.length; i++) {
      if(markers[i].start == start) {
        return markers[i];
      }
    }
    return null;
  }

  async deleteMarkers(segmentId: string, type: string) {
    //return await this.markerRepository.createQueryBuilder("U").delete().where({ segmentId: id.toString()});
    let markers: Marker[] =  await this.markerRepository.find({ where: { segmentId } });
    let markerIds: string[] = [];
    for(let i=0; i< markers.length; i++) {
      markerIds.push(markers[i].id.toString());
      await this.trackerRepository.delete(markers[i].trackerId.toString());
      await this.markerRepository.delete(markers[i].id.toString());
    }
    return markerIds;
  }

  async updateTracker(id: string, tracker: QueryDeepPartialEntity<Tracker>) {
    return await this.trackerRepository.update(id, tracker);
  }

  async getSegmentMarkers(segmentId: string) {
    return this.markerRepository.find({ where: { segmentId } });
  }

  async getMarkerByTracker(trackerId: string) {
    return this.markerRepository.findOne({ where: { trackerId } });
  }

  async autoUpdateTrackers(tracker: Tracker) {
    let segmentId = tracker.segmentId;
    let trackers: Tracker[] = await this.trackerRepository.find({where: { segmentId: segmentId }});
    trackers.forEach(item => {
      this.getMarkerByTracker(item.id.toHexString()).then( marker => {
        if(marker) {
          marker.completed = true;
          this.updateMarker(marker.id.toString(), marker);
        }
      });
      if(item.firstUpdate) {
        item.trackerType = tracker.trackerType;
        item.trackables = tracker.trackables;
        item.firstUpdate = false;
        item.authorId = tracker.authorId;
        item.authorClass = tracker.authorClass;
        item.labelName = tracker.labelName;
        item.selectedColor = tracker.selectedColor;
        this.updateTracker(item.id.toString(), item);
      }
    })
  }

  async updateTrackerColor(labelId: string, newColor: string) {
    let trackers: Tracker[] = await this.trackerRepository.find({where: { labelId: labelId }});
    trackers.forEach(item => {
        let newTrackables = [];
        item.trackables.forEach( trackable => newTrackables.push(trackable.replace(item.selectedColor, newColor)));
        item.trackables = newTrackables;
        item.selectedColor = newColor;
        this.updateTracker(item.id.toString(), item);
    });
  }

  async updateMarker(id: string, marker: QueryDeepPartialEntity<Marker>) {
    return await this.markerRepository.update(id, marker);
  }

  async fetchTrackerResults(segmentId: string, videoWidth: number, videoHeight: number): Promise<TrackerResult[]> {
    let trackers: TrackerResult[] = [];
    let markers: Marker[] = await this.getSegmentMarkers(segmentId);
    for (const marker of markers) {
      if(marker.completed) {
        let tracker: Tracker = await this.getTracker(marker.trackerId);
        trackers.push({timeInstance: marker.start, trackerType: tracker.trackerType, trackerDimensions: MarkerService.getTrackableResult(tracker.trackables, tracker.trackerType, videoWidth, videoHeight)});
      }
    }
    return trackers;
  }

  /**
   * Used for generating dimensions for the regions of interest of each label instance. Called in two places, one in annotation export
   * and the other while sending requests for tracking. Export of annotations require dimensions in ratios, hence the parameters videoWidth
   * and videoHeight. This is NOT NEEDED for tracking which relies on actual co-ordinates.
   * @param trackables
   * @param trackerType
   * @param videoWidth
   * @param videoHeight
   */
  public static getTrackableResult(trackables: string[], trackerType: string, videoWidth?: number, videoHeight?: number) {
    if (trackerType)
      switch (trackerType) {
        case "rect": return this.getRectangleTracker(trackables, videoWidth, videoHeight);
        case "circle": return this.getCircleTracker(trackables, videoWidth, videoHeight);
        case "polyline":
        case "polygon":  return this.getPolyTracker(trackables, trackerType, videoWidth, videoHeight);
      }
    return {};
  }

  private static getRectangleTracker(trackables: string[], videoWidth: number, videoHeight: number): RectangleTracker {
    const rectangleData = JSON.parse(trackables[0]);
    let rectangleResponse = {
      height: parseFloat(rectangleData.split(" height=\"")[1].split("\"")[0]),
      width: parseFloat(rectangleData.split(" width=\"")[1].split("\"")[0]),
      x: parseFloat(rectangleData.split(" x=\"")[1].split("\"")[0]),
      y: parseFloat(rectangleData.split(" y=\"")[1].split("\"")[0])
    };
    if (videoHeight && videoWidth) {
      rectangleResponse = { height: rectangleResponse.height / videoHeight, width: rectangleResponse.width / videoWidth, x: rectangleResponse.x / videoWidth, y: rectangleResponse.y / videoHeight};
    }
    return rectangleResponse;
  }

  private static getCircleTracker(trackables: string[], videoWidth: number, videoHeight: number): CircleTracker {
    const circleData = JSON.parse(trackables[0]);
    let circleResponse = {radius: parseFloat(circleData.split(" r=\"")[1].split("\"")[0]), x: parseFloat(circleData.split(" cx=\"")[1].split("\"")[0]), y: parseFloat(circleData.split(" cy=\"")[1].split("\"")[0])};
    if (videoHeight && videoWidth) {
        circleResponse = { radius: circleResponse.radius / videoWidth, x: circleResponse.x / videoWidth, y: circleResponse.y / videoHeight};
    }
    return circleResponse;
  }

  private static getPolyTracker(trackables: string[], trackerType: string, videoWidth: number, videoHeight: number): PolyTracker {
    const polylineData = JSON.parse(trackables[0]);
    const points: Point[] = [];
    const arr = polylineData.split(" points=\"")[1].split("\"")[0].split(' ');
    while (arr.length) {
      let currentPoint = arr.splice(0, 1);
      currentPoint = currentPoint[0].split(',');
      if (videoHeight && videoWidth) {
        points.push({x: Number(currentPoint[0]) / videoWidth, y: Number(currentPoint[1]) / videoHeight});
      } else {
        points.push({x: Number(currentPoint[0]), y: Number(currentPoint[1])});
      }
    }
    return {start: points[0], end: trackerType == 'polygon' ? points[0] : points[points.length - 1], points: points};
  }

  async addMarkerDataToTracker(trackerId: string, markerId: string) {
    this.getTracker(trackerId).then(tracker => {
      tracker.markerId = markerId;
      this.updateTracker(trackerId, tracker).then(result => {console.log(result)});
    });
  }

  async findTimesForTracking(markerId: string) {
    const marker: Marker = await this.getMarker(markerId);
    const markers: Marker[] = await this.markerRepository.find({ where: { segmentId: marker.segmentId } });
    let searchedMarkers: Marker[] = [];
    let requiredTimes: number[] = [];
    markers.forEach( mark => {
      if(mark.start > marker.start) {
        requiredTimes.push(mark.start);
        searchedMarkers.push(mark);
      }
    });
    return { 'initialTrackerTime': marker.start, 'requiredTimes': requiredTimes, 'markers': searchedMarkers};
  }

  async updateTrackerPrediction(tracker: Tracker, data: any, markers: Marker[], videoDimensions: string[]) {
    if(tracker.trackerType == 'rect') {
      let trackable  = tracker.trackables;
      for (const marker of markers) {
        if(this.isPredictionSuccessful(data[''+ marker.start])) {
          const track: Tracker = await this.getTracker(marker.trackerId);
          track.trackerType = tracker.trackerType;
          //TODO: Restructure the response from video analyzer to give responses by timeslot at the key
          trackable = MarkerService.updatePredictedTracker(trackable, data[''+ marker.start], videoDimensions);
          track.trackables = trackable;
          this.updateTracker(marker.trackerId.toString(), track);
        }
      }
    }
    return 'completed'
  }

  private static updatePredictedTracker(trackable: string[], predictedData: any, videoDimensions: string[]) {
    // console.log(predictedData);
    const tuple = this.adjustForVideoSize(predictedData['trackerDim'].toString().replace('(','').replace(')','').split(','), videoDimensions);
    trackable[0] = trackable[0].split(' x=\\"')[0] + ' x=\\"' + tuple[0] + '\\'+ trackable[0].split(' x=\\"')[1].substring(trackable[0].split(' x=\\"')[1].indexOf('\\') + 1);
    trackable[0] = trackable[0].split(' y=\\"')[0] + ' y=\\"' + tuple[1] + '\\' + trackable[0].split(' y=\\"')[1].substring(trackable[0].split(' y=\\"')[1].indexOf('\\') + 1);
    trackable[0] = trackable[0].split(' width=\\"')[0] + ' width=\\"' + tuple[2] + '\\'+ trackable[0].split(' width=\\"')[1].substring(trackable[0].split(' width=\\"')[1].indexOf('\\') + 1);
    trackable[0] = trackable[0].split(' height=\\"')[0] + ' height=\\"' + tuple[3] + '\\'+ trackable[0].split(' height=\\"')[1].substring(trackable[0].split(' height=\\"')[1].indexOf('\\') + 1);
    return trackable;
  }

  private isPredictionSuccessful(markerPredictionInfo: any) {
    if(markerPredictionInfo && markerPredictionInfo['status'])
      return markerPredictionInfo['status'] == '200';
    return false;
  }

  /**
   * Adjust x and y co-ordinates to not be less than 0. Adjust width and height to not cross video dimensions
   * @param tuple
   * @param videoDimensions
   */
  private static adjustForVideoSize(tuple, videoDimensions: string[]) {
    let x = Number(tuple[0]);
    let y = Number(tuple[1]);
    let width = Number(tuple[2]);
    let height = Number(tuple[3]);
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > Number(videoDimensions[1])) width = Number(videoDimensions[1]) - x;
    if (y + height > Number(videoDimensions[0])) height = Number(videoDimensions[0]) - y;
    return [x, y, width, height];
  }
}