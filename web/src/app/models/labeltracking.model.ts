import { Range } from './range';
import { UserModel } from './user.model';
import { DirectoryModel } from './directory.model';

export class LabelMetadataModel {

  constructor(
    public categoryName: string,
    public isTrackingEnabled: boolean = false,
    public authorId: string,
    public samplingFrequency?: number,
    public samplingUnit?: string,
    public metadata?: string ) { }

}
