import { SegmentModel } from './segmentModel';

export class LabelModel {
  id: string;
  name: string;
  projectId: string;
  authorId: string;
  authorClass: string;
  series: SegmentModel[];
}
