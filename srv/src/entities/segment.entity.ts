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

  @Column()
  authorClass: string;

  constructor(labelId: ObjectID, authorId: ObjectID, start: number, end: number, authorClass: string) {
    this.labelId = labelId;
    this.authorId = authorId;
    this.start = start;
    this.end = end;
    this.authorClass = authorClass;
  }
}
