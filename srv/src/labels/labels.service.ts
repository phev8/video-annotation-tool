import { Injectable } from '@nestjs/common';
import { DeleteResult, InsertResult, MongoRepository, UpdateResult } from 'typeorm';
import { Label } from '../entities/label.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LabelCategory } from '../entities/labelcategory.entity';
import { LabelCategoryDto } from '../dto/label.category.dto';
import { SegmentService } from './segment/segment.service';
import { MarkerService } from './trackers/marker/marker.service';

@Injectable()
export class LabelsService {
  constructor(@InjectRepository(Label)
              private readonly labelRepository: MongoRepository<Label>, @InjectRepository(LabelCategory)
              private readonly labelCategoryRepository: MongoRepository<LabelCategory>,
              private segmentService: SegmentService,
              private markerService: MarkerService) {
  }

  async createLabel(projectId: string, authorId: string, categoryId: string, authorClass: string): Promise<Label> {
    let labelCategory: LabelCategory = await this.labelCategoryRepository.findOne(categoryId);
    const label = new Label(projectId, authorId, labelCategory.name+'_'+(labelCategory.labels.length + 1), authorClass);
    await this.labelRepository.insert(label);
    labelCategory.labels.push(label);
    await this.labelCategoryRepository.update(labelCategory.id.toString(), {labels: labelCategory.labels});
    return await this.labelRepository.findOne(label);
  }

  async createLabelCategory(projectId: string, authorId: string, authorClass: string, labelCategoryWrapper: LabelCategoryDto): Promise<InsertResult> {
    let label = new Label(projectId, authorId, labelCategoryWrapper.categoryName +'_1', authorClass);
    await this.labelRepository.insert(label);
    let labels: Label[] = [];
    labels.push(label);
    const labelCategory = new LabelCategory(projectId, authorId, labelCategoryWrapper.categoryName, labels, authorClass, labelCategoryWrapper);
    return await this.labelCategoryRepository.insert(labelCategory);
  }

  async createSystemGeneratedLabelCategory(projectId: string, authorId: string, authorClass: string, labelCategoryWrapper: LabelCategoryDto) {
    let labelCategories: LabelCategory[] = await this.getSystemGeneratedCategories(projectId, authorId, labelCategoryWrapper.categoryName);
    if(labelCategories.length == 0) {
      let response = await this.createLabelCategory(projectId, authorId, authorClass, labelCategoryWrapper);
      return await this.getLabelCategory(response.identifiers[0].id.toString());
    }
    return labelCategories[0];
    //return await this.createLabel(projectId,authorId, labelCategories[0].id.toString(), authorClass);
  }

  async getSystemGeneratedCategories(projectId: string, authorId: string, categoryName: string, select?: (keyof LabelCategory)[]) {
    const labelCategories: LabelCategory[] = await this.getLabelCategories(projectId);
    if(labelCategories && labelCategories.length!= 0) {
      let selectedCategories: LabelCategory[] = [];
      labelCategories.forEach(categories => {
        if(categories.authorId.toString() == authorId && categories.name == categoryName) {
          return selectedCategories.push(categories);
        }
      });
      return selectedCategories;
    }
    return [];
  }

  async updateLabelName(labelId: string, change: string): Promise<UpdateResult> {
    return await this.labelRepository.update(labelId, {name: change});
  }

  async updateLabelCategoryName(labelCategoryId: string, change: string): Promise<UpdateResult> {
    let labelCategory = await this.getLabelCategory(labelCategoryId);
    labelCategory.labels.map( (items) => {
      let labelName = change + '_' + items.name.split('_')[1];
      this.updateLabelName(items["_id"].toString(), labelName);
      items.name = labelName;
    });
    return await this.labelCategoryRepository.update(labelCategoryId, {name: change, labels: labelCategory.labels});
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

  /**
   * Deletes the label, modifies label category to remove the deleted label from
   * its list of labels.
   * @param id : string - Label Id
   * @param categoryId : string - Label category Id
   */
  async deleteLabel(id: string, categoryId?: string): Promise<DeleteResult> {
    let response = await this.labelRepository.delete(id);
    if(categoryId) {
      let category: LabelCategory = await this.labelCategoryRepository.findOne(categoryId);
      let labels = [];
      category.labels.forEach(label => { let labelId = label["id"]? label["id"]: label["_id"]; if(labelId!= id ) labels.push(label);});
      await this.labelCategoryRepository.update(categoryId, {labels: labels});
    }
    await this.segmentService.deleteSegmentsForLabel(id).then(result => {});
    return  response;
  }

  async deleteLabelCategory(id: string): Promise<DeleteResult> {
    let category: LabelCategory = await this.labelCategoryRepository.findOne(id);
    for(var j=0 ; j< category.labels.length; j++) {
      category.labels[j]["id"] = category.labels[j]["_id"];
      await this.segmentService.deleteSegmentsForLabel(category.labels[j]["id"].toString()).then(result => {});
      await this.labelRepository.remove(category.labels[j]);
    }
    return await this.labelCategoryRepository.delete(id);
  }

  async  deleteProjectLabelCategories(projectId: string) {
    let categories: LabelCategory[] = await this.getLabelCategories(projectId);
    for(let category of categories) {
      this.deleteLabelCategory(category.id.toString()).then(result => {console.log("Deleted Category : "+ category.name)})
    }
  }
}
