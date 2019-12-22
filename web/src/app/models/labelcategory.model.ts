import { SegmentModel } from './segment.model';
import { LabelModel } from './label.model';

export class LabelCategoryModel {

  constructor(
    public id: string,
    public name: string,
    public projectId: string,
    public authorId: string,
    public authorClass: string,
    public labels: LabelModel[],
    public isTrackable: boolean,
    public samplingFrequency?: number,
    public samplingUnit?: string,
    public metadata?: string,
  ) {}
}
