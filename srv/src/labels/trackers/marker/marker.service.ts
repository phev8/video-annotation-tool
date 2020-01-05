import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { Marker } from '../../../entities/markers.entity';
import { Tracker } from '../../../entities/tracker.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';


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
      await this.markerRepository.delete(markers[i].id.toString());
    }
    return markerIds;
  }

  async updateTracker(id: string, tracker: QueryDeepPartialEntity<Tracker>) {
    return await this.trackerRepository.update(id, tracker);
  }

  async autoUpdateTrackers(tracker: Tracker) {
    let labelId = tracker.labelId;
    let trackers: Tracker[] = await this.trackerRepository.find({where: { labelId: labelId }});
    trackers.forEach(item => {
      if(item.firstUpdate) {
        item.trackerType = tracker.trackerType;
        item.trackables = tracker.trackables;
        item.firstUpdate = false;
        item.authorId = tracker.authorId;
        item.authorClass = tracker.authorClass;
        this.updateTracker(item.id.toString(), item);
      }
    })
  }
}