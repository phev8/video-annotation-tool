import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { Marker } from '../../../entities/markers.entity';


@Injectable()
export class MarkerService {
  constructor(@InjectRepository(Marker)
              private readonly markerRepository: MongoRepository<Marker>) {
  }

  async getMarkers(labelId: string) {
    return await this.markerRepository.find({ where: { labelId } });
  }

  async addMarker(marker: { completed: boolean; start: number; labelId: any; authorId: string; authorClass: string, segmentId: any }) {
    let markers: Marker[] = await this.markerRepository.find({ where: {segmentId: marker.segmentId, start: marker.start} });
    if(markers && markers.length == 0) {
      return await this.markerRepository.insertOne(new Marker(marker.labelId, marker.authorId, marker.start, marker.authorClass, marker.completed, "Asdasd", marker.segmentId));
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
}