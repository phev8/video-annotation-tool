import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { Directory } from './directory.entity';
import { ObjectID } from 'mongodb';

@Entity()
export class Project {

  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  title: string;

  @Column()
  ownerId: ObjectID;

  @Column()
  memberIds: ObjectID[];

  @Column()
  description: string;

  @Column()
  modified: Date;

  @Column()
  fileTree: Directory;
}
