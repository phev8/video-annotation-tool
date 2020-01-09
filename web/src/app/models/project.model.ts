import { DirectoryModel } from './directory.model';
import { UserModel } from './user.model';

export class ProjectModel {
  constructor(
    public id: string,
    public title: string,
    public modified: Date,
    public singleMedia: boolean,
    public supervisorIds: UserModel[],
    public contributorIds: UserModel[],
    public ownerId?: UserModel,
    public memberIds?: string[],
    public description?: string,
    public fileTree?: DirectoryModel,
    public videoDimensions?: string
  ) {}
}
