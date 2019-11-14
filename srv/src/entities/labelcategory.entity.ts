import { Column, Entity, ObjectIdColumn, OneToMany, TreeChildren } from 'typeorm';
import { Segment } from './segment.entity';
import { ObjectID } from 'mongodb';
import { Label } from './label.entity';
import { LabelCategoryDto } from '../dto/label.category.dto';

@Entity()
export class LabelCategory {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  name: string;

  @Column()
  projectId: ObjectID;

  @Column()
  authorId: ObjectID;

  @Column()
  labels: Label[];

  @Column()
  authorClass: string;

  @Column()
  isTrackable: boolean;

  @Column()
  samplingFrequency: number;

  @Column()
  samplingUnit: string;

  @Column()
  metadata: string;

  constructor(projectId, authorId, name: string, labels: Label[], authorClass: string, labelCategoryWrapper: LabelCategoryDto) {
    this.projectId = projectId;
    this.authorId = authorId;
    this.name = name;
    this.labels = labels;
    this.authorClass = authorClass;
    if(labelCategoryWrapper!= null) {
      this.isTrackable = labelCategoryWrapper.isTrackingEnabled != null ? labelCategoryWrapper.isTrackingEnabled: false;
      if(labelCategoryWrapper.isTrackingEnabled) {
        this.samplingFrequency = labelCategoryWrapper.samplingFrequency;
        this.samplingUnit = labelCategoryWrapper.samplingUnit;
        this.metadata = labelCategoryWrapper.metadata;
      }
    }
  }
}
