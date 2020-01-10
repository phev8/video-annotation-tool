import { Column } from 'typeorm';
import { FileUpload } from '../interfaces/file.upload';

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


  constructor(upload?: FileUpload) {
    if(upload) {
      this.name = upload.originalname;
      this.filename = upload.filename;
      this.path = upload.path;
      this.size = upload.size;
      this.mimetype = upload.mimetype;
    }
  }
}
