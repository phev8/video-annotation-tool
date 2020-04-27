import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectID } from 'mongodb';

@Entity()
export class Tracker {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  authorId: ObjectID;

  @Column()
  authorClass: string;

  @Column()
  labelId: string;

  @Column()
  trackerType: string;

  @Column()
  trackables: string[];

  @Column()
  firstUpdate: boolean;

  @Column()
  labelName: string;

  @Column()
  markerId: string;

  @Column()
  selectedColor: string;

  @Column()
  segmentId: string;

  constructor(labelId: string, segmentId: any) {
    this.trackables = [];
    this.firstUpdate = true;
    this.labelId = labelId;
    this.segmentId = segmentId;
  }
}
