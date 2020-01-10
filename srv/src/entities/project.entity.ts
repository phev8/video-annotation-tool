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

  constructor(body: any) {
    if(body) {
      this.title = body.title;
      this.description = body.description;
      this.singleMedia = body.singleMedia;
      this.modified = new Date();
      this.ownerId = body.ownerId;
      this.contributorIds = [];
      this.supervisorIds = [];
      body.supervisorIds.map(ids => this.supervisorIds.push(ids));
      body.contributorIds.map(ids => this.contributorIds.push(ids));
      this.fileTree = new Directory();
      this.fileTree.parent = null;
      this.fileTree.children = [];
    }
  }
}
