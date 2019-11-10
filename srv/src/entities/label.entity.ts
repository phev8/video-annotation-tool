import { Column, Entity, ManyToOne, ObjectIdColumn } from 'typeorm';
import { Segment } from './segment.entity';
import { ObjectID } from 'mongodb';
import { LabelCategory } from './labelcategory.entity';

@Entity()
export class Label {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  name: string;

  @Column()
  projectId: ObjectID;

  @Column()
  authorId: ObjectID;

  @Column()
  authorClass: string;

  constructor(projectId: ObjectID, authorId: ObjectID, name: string, authorClass: string) {
    this.projectId = projectId;
    this.authorId = authorId;
    this.name = name;
    this.authorClass = authorClass;
  }
}
