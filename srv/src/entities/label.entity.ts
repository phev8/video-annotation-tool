import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { Segment } from './segment.entity';
import { ObjectID } from 'mongodb';

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

  constructor(projectId: ObjectID, authorId: ObjectID, name: string) {
    this.projectId = projectId;
    this.authorId = authorId;
    this.name = name;
  }
}
