export interface PredictionResult {
  classes: string[];
  confidences: number[];
  'bounding boxes': number[][];
}