import { Column, Entity, ObjectIdColumn, OneToMany, TreeChildren } from 'typeorm';
import { Segment } from './segment.entity';
import { ObjectID } from 'mongodb';
import { Label } from './label.entity';

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

  constructor(projectId: ObjectID, authorId: ObjectID, name: string, labels: Label[], authorClass: string) {
    this.projectId = projectId;
    this.authorId = authorId;
    this.name = name;
    this.labels = labels;
    this.authorClass = authorClass;
  }
}
