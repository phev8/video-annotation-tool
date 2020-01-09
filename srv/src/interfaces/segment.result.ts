import { TrackerResult } from './tracker.result';

export class SegmentResult {
  start: number;
  end: number;
  trackable: boolean;
  trackers?: TrackerResult[];
}