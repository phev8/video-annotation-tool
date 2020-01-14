
export class TrackerModel {
  constructor(
    public id: string,
    public authorId: string,
    public authorClass: string,
    public trackerType: string,
    public trackables: string[],
    public labelId: string,
    public firstUpdate: string,
    public labelName: string,
    public selectedColor: string,
  ) {}
}
