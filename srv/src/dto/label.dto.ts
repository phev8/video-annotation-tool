import { SegmentDto } from './segment.dto';

export class LabelDto {
  id: string;
  name: string;
  projectId: string;
  authorId: string;
  series: SegmentDto[];
}
