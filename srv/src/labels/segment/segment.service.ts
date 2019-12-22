import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { Segment } from '../../entities/segment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectID } from 'mongodb';
import { MarkerService } from '../trackers/marker/marker.service';

@Injectable()
export class SegmentService {
  constructor(@InjectRepository(Segment)
              private readonly segmentRepository: MongoRepository<Segment>,
              private readonly markerService: MarkerService) {
  }

  async createSegment(labelId: string, authorId: string, start: number, end: number, authorClass: string) {
    const segment = new Segment(labelId, authorId, start, end, authorClass);
    let insertResult = await this.segmentRepository.insert(segment);
    return insertResult;
  }

  async updateSegment(segmentId: string, start: number, end: number) {
    return await this.segmentRepository.update(segmentId, { start: start, end: end });
  }

  async getSegments(labelId: string) {
    return await this.segmentRepository.find({ where: { labelId } });
  }

  async getSegment(labelId: string, start: number, end: number, authorId: string) {
    return await this.segmentRepository.find({ where: { labelId: labelId, start: start, end:end, authorId: authorId } });
  }

  async deleteSegment(segmentId: ObjectID) {
    return await this.segmentRepository.delete(segmentId);
  }

  async mergeSegment(segmentIds: string[], start: number, end: number) {
    let updatedSegmentId = segmentIds[0];
    for(let i=1; i< segmentIds.length; i++) {
      await this.deleteSegment(segmentIds[i]).catch(function(err) {
        console.log("DELETE ERROR : " +err);
      });
      await this.markerService.deleteMarkers(segmentIds[i], "segmentId").catch(function(err) {
        console.log("DELETE ERROR : " +err);
      });
    }
    return await this.segmentRepository.update(updatedSegmentId.toString(), { start: start, end: end });
  }
}
