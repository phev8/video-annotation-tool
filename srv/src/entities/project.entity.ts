import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { Directory } from './directory.entity';
import { ObjectID } from 'mongodb';
import { User } from './user.entity';

@Entity()
export class Project {

  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  title: string;

  @Column()
  ownerId: User;

  @Column()
  supervisorIds: User[];

  @Column()
  contributorIds: User[];

  @Column()
  description: string;

  @Column()
  modified: Date;

  @Column()
  fileTree: Directory;

  @Column()
  singleMedia: boolean;

  @Column()
  videoDimensions: string;
}
