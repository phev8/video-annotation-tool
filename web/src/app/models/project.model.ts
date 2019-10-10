import { DirectoryModel } from './directory.model';

export class ProjectModel {
  constructor(
    public id: string,
    public title: string,
    public modified: Date,
    public ownerId?: string,
    public memberIds?: string[],
    public description?: string,
    public fileTree?: DirectoryModel,
  ) {}
}
