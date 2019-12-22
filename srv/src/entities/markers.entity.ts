import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectID } from 'mongodb';

@Entity()
export class Marker {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  start: number;

  @Column()
  authorId: ObjectID;

  @Column()
  labelId: ObjectID;

  @Column()
  authorClass: string;

  @Column()
  completed: boolean;

  @Column()
  trackerId: string;

  @Column()
  segmentId: ObjectID;

  constructor(labelId: ObjectID, authorId: ObjectID, start: number, authorClass: string, completed: boolean, trackerId: string, segmentId: ObjectID) {
    this.labelId = labelId;
    this.authorId = authorId;
    this.start = start;
    this.authorClass = authorClass;
    this.completed = completed;
    this.trackerId = trackerId;
    this.segmentId = segmentId;
  }
}
