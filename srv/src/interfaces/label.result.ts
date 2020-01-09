import { SegmentResult } from './segment.result';

export interface LabelResult {
  labelName: string;
  segments?: SegmentResult[];
}