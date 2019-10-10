import { FileModel } from './file.model';

export class DirectoryModel extends FileModel {
  children: FileModel[];
  parent: DirectoryModel[];
}
