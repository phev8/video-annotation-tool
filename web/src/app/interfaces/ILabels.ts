import { LabelModel } from '../models/label.model';

export interface Labels {
  projectId: string;
  labels: LabelModel[];
}
