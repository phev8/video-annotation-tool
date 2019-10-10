import { RecordingEventType } from './recording.event.type';
import { SegmentModel } from './segmentModel';

export class RecordingEvent {
  eventType: RecordingEventType;
  labelId: string;
  segment: SegmentModel;
}
