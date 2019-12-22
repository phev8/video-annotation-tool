import { SegmentModel } from './segment.model';

export class LabelModel {
  id: string;
  name: string;
  projectId: string;
  authorId: string;
  authorClass: string;
  series: SegmentModel[];
}
