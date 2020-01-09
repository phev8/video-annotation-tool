import { LabelResult } from './label.result';

export interface AnnotationResult {
  categoryName: string;
  labels?: LabelResult[];
}