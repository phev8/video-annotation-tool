import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectID } from 'mongodb';

@Entity()
export class Segment {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  start: number;

  @Column()
  end: number;

  @Column()
  authorId: ObjectID;

  @Column()
  labelId: ObjectID;

  constructor(labelId: ObjectID, authorId: ObjectID, start: number, end: number) {
    this.labelId = labelId;
    this.authorId = authorId;
    this.start = start;
    this.end = end;
  }
}
