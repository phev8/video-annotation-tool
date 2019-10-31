import { Injectable } from '@nestjs/common';
import { DeleteResult, InsertResult, MongoRepository, UpdateResult } from 'typeorm';
import { Label } from '../entities/label.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LabelCategory } from '../entities/labelcategory.entity';
import * as SocketIO from 'socket.io';

@Injectable()
export class LabelsService {
  constructor(@InjectRepository(Label)
              private readonly labelRepository: MongoRepository<Label>, @InjectRepository(LabelCategory)
              private readonly labelCategoryRepository: MongoRepository<LabelCategory>) {
  }

  async createLabel(projectId: string, authorId: string): Promise<InsertResult> {
    const label = new Label(projectId, authorId, 'Label');
    return await this.labelRepository.insert(label);
  }

  async createLabelCategory(projectId: string, authorId: string): Promise<InsertResult> {
    let label = new Label(projectId, authorId, 'LabelCategory1');
    await this.labelRepository.insert(label);
    let labels: Label[] = [];
    labels.push(label);
    const labelCategory = new LabelCategory(projectId, authorId, 'LabelCategory', labels);
    return await this.labelCategoryRepository.insert(labelCategory);
  }

  async updateLabelName(labelId: string, change: string): Promise<UpdateResult> {
    return await this.labelRepository.update(labelId, {name: change});
  }

  async updateLabelCategoryName(labelId: string, change: string): Promise<UpdateResult> {
    return await this.labelCategoryRepository.update(labelId, {name: change});
  }

  async getLabels(projectId: string, select?: (keyof Label)[]): Promise<Label[]> {
    return await this.labelRepository
      .find({
        select,
        where: { projectId },
      });
  }

  async getLabelCategories(projectId: string, select?: (keyof LabelCategory)[]): Promise<LabelCategory[]> {
    return await this.labelCategoryRepository
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

  async getLabelCategory(id: string) {
    return await this.labelCategoryRepository.findOne(id);
  }

  async deleteLabel(id: string): Promise<DeleteResult> {
    return await this.labelRepository.delete(id);
  }

  async deleteLabelCategory(socket: SocketIO.Socket, id: string, room: any): Promise<DeleteResult> {
    let category: LabelCategory = await this.labelCategoryRepository.findOne(id);
    for(var j=0 ; j< category.labels.length; j++) {
      category.labels[j]["id"] = category.labels[j]["_id"];
      await this.labelRepository.remove(category.labels[j]);
    }
    return await this.labelCategoryRepository.delete(id);
  }

  async  deleteProjectLabelCategories(projectId: string) {
    let categories: LabelCategory[] = await this.getLabelCategories(projectId);
    for(var i = 0 ; i < categories.length; i++) {
      for(var j=0 ; j< categories[i].labels.length; j++) {
        categories[i].labels[j]["id"] = categories[i].labels[j]["_id"];
        await this.labelRepository.remove(categories[i].labels[j]);
      }
      await this.labelCategoryRepository.remove(categories[i]);
    }
  }
}