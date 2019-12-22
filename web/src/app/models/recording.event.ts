import { RecordingEventType } from './recording.event.type';
import { SegmentModel } from './segment.model';

export class RecordingEvent {
  eventType: RecordingEventType;
  labelId: string;
  segment: SegmentModel;
}
