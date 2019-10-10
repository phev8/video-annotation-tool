import { Injectable } from '@nestjs/common';
import { DeleteResult, InsertResult, MongoRepository, UpdateResult } from 'typeorm';
import { Label } from '../entities/label.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LabelsService {
  constructor(@InjectRepository(Label)
              private readonly labelRepository: MongoRepository<Label>) {
  }

  async createLabel(projectId: string, authorId: string): Promise<InsertResult> {
    const label = new Label(projectId, authorId, 'Label');
    return await this.labelRepository.insert(label);
  }

  async updateLabelName(labelId: string, change: string): Promise<UpdateResult> {
    return await this.labelRepository.update(labelId, {name: change});
  }

  async getLabels(projectId: string, select?: (keyof Label)[]): Promise<Label[]> {
    return await this.labelRepository
      .find({
        select,
        where: { projectId },
      });
  }

  async deleteLabels(labelId: string) {
    return await this.labelRepository.delete(labelId);
  }

  async getLabel(id: string) {
    return await this.labelRepository.findOne(id);
  }

  async deleteLabel(id: string): Promise<DeleteResult> {
    return await this.labelRepository.delete(id);
  }
}
