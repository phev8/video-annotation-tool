import { SegmentModel } from './segmentModel';
import { LabelModel } from './label.model';

export class LabelCategoryModel {
  id: string;
  name: string;
  projectId: string;
  authorId: string;
  labels: LabelModel[];
}
