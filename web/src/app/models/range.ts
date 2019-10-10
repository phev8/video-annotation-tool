export class Range {
  id: string;
  authorId: string;
  startTime: number;
  endTime: number;

  constructor(id: string, authorId: string, startTime: number, endTime: number) {
    this.id = id;
    this.authorId = authorId;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  public toString = (): string => {
    return `Range (${this.startTime}, ${this.endTime})`;
  }
}
