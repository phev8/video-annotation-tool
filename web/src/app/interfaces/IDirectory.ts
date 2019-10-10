import { IFile } from './IFile';

export interface IDirectory extends IFile {
  files: IFile[];
  expanded: boolean;
}
