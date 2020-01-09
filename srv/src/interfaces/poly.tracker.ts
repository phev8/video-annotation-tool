import { Point } from './point';

export interface PolyTracker {
  start: Point;
  points: Point[];
  end: Point;
}