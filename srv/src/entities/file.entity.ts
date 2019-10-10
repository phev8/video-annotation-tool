import { Column } from 'typeorm';

export class File {
  @Column()
  name: string;

  @Column()
  filename: string;

  @Column()
  path: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;
}
