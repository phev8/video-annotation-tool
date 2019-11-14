import { SegmentDto } from './segment.dto';

export class LabelCategoryDto {

  constructor(
  public categoryName: string,
  public isTrackingEnabled: boolean = false,
  public authorId: string,
  public samplingFrequency?: number,
  public samplingUnit?: string,
  public metadata?: string ) { }
}
