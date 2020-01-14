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

  async addMarker(marker: { completed: boolean; start: number; labelId: any; authorId: string; authorClass: string, segmentId: any }) {
    let markers: Marker[] = await this.markerRepository.find({ where: {segmentId: marker.segmentId, start: marker.start} });
    if(markers && markers.length == 0) {
      let trackerId  = await this.trackerRepository.insertOne(new Tracker(marker.labelId));
      return await this.markerRepository.insertOne(new Marker(marker.labelId, marker.authorId, marker.start, marker.authorClass, marker.completed, trackerId.insertedId.toString(), marker.segmentId));
    }
    return;
  }

  async findMarkers(data: any[]) {
    return await this.markerRepository.findByIds(data);
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
    let labelId = tracker.labelId;
    let trackers: Tracker[] = await this.trackerRepository.find({where: { labelId: labelId }});
    trackers.forEach(item => {
      this.getMarkerByTracker(item.id.toHexString()).then( marker => {
        marker.completed = true;
        this.updateMarker(marker.id.toString(), marker);
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

  async fetchTrackerResults(segmentId: string): Promise<TrackerResult[]> {
    let trackers: TrackerResult[] = [];
    let markers: Marker[] = await this.getSegmentMarkers(segmentId);
    for (const marker of markers) {
      if(marker.completed) {
        let tracker: Tracker = await this.getTracker(marker.trackerId);
        trackers.push({timeInstance: marker.start, trackerType: tracker.trackerType, trackerDimensions: MarkerService.getTrackableResult(tracker.trackables, tracker.trackerType)});
      }
    }
    return trackers;
  }

  private static getTrackableResult(trackables: string[], trackerType: string) {
    if(trackerType)
      switch (trackerType) {
        case "rect": return this.getRectangleTracker(trackables);
        case "circle": return this.getCircleTracker(trackables);
        case "polyline":
        case "polygon":  return this.getPolyTracker(trackables, trackerType);
      }
    return {};
  }

  private static getRectangleTracker(trackables: string[]): RectangleTracker {
    let rectangleData = JSON.parse(trackables[0]);
    return {height: parseFloat(rectangleData.split(" height=\"")[1].split("\"")[0]), width: parseFloat(rectangleData.split(" width=\"")[1].split("\"")[0]), x: parseFloat(rectangleData.split(" x=\"")[1].split("\"")[0]), y: parseFloat(rectangleData.split(" y=\"")[1].split("\"")[0])};
  }

  private static getCircleTracker(trackables: string[]): CircleTracker {
    let circleData = JSON.parse(trackables[0]);
    return {radius: parseFloat(circleData.split(" r=\"")[1].split("\"")[0]), x: parseFloat(circleData.split(" cx=\"")[1].split("\"")[0]), y: parseFloat(circleData.split(" cy=\"")[1].split("\"")[0])};
  }

  private static getPolyTracker(trackables: string[], trackerType: string): PolyTracker {
    let polylineData = JSON.parse(trackables[0]);
    let points: Point[] = [];
    let arr = polylineData.split(" points=\"")[1].split("\"")[0].split(" ");
    while(arr.length) {
      let currentPoint = arr.splice(0,2);
      points.push({x: currentPoint[0], y: currentPoint[1]});
    }
    return {start: points[0], end: trackerType == "polygon"? points[0]: points[points.length-1], points: points};
  }
}