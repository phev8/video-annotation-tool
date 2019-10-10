import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { Segment } from '../../entities/segment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectID } from 'mongodb';

@Injectable()
export class SegmentService {
  constructor(@InjectRepository(Segment)
              private readonly segmentRepository: MongoRepository<Segment>) {
  }

  async createSegment(labelId: string, authorId: string, start: number, end: number) {
    const segment = new Segment(labelId, authorId, start, end);
    return await this.segmentRepository.insert(segment);
  }

  async updateSegment(segmentId: string, start: number, end: number) {
    return await this.segmentRepository.update(segmentId, { start, end });
  }

  async getSegments(labelId: string) {
    return await this.segmentRepository.find({ where: { labelId } });
  }

  async deleteSegment(segmentId: ObjectID) {
    return await this.segmentRepository.delete(segmentId);
  }
}
