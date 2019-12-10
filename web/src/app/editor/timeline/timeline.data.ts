import * as vis from 'vis';
import { DataGroup, DataItem, DataSet, IdType } from 'vis';
import * as hyperid from 'hyperid';

import _ from "lodash";
import { Time } from './time';

export class TimelineData {
  private readonly _groups: vis.DataSet<DataGroup>;
  private readonly _items: vis.DataSet<DataItem>;
  private readonly _map: Map<IdType, { id: IdType, recording: boolean, update: boolean }>;

  private instance = hyperid();
  private deleteWrongRecords = true;

  constructor() {
    this._groups = new vis.DataSet<DataGroup>();
    this._items = new vis.DataSet<DataItem>();
    this._map = new Map<IdType, { id: IdType, recording: boolean, update: boolean }>();
  }

  getGroupIds(): IdType[] {
    return this._groups.getIds();
  }

  clear() {
    this._groups.clear();
    this._items.clear();
  }

  addGroup(group: DataGroup) {
    this._groups.add(group);
    this._map.set(group.id, {id: undefined, recording: false, update: false});
  }

  addGroups(groups: DataGroup[]) {
    this._groups.add(groups);
    groups.forEach(x => {
      this._map.set(x.id, {id: undefined, recording: false, update: false});
    });
  }

  addItem(item: DataItem) {
    this._items.add(item);
  }

  removeGroup(id: string) {
    this._groups.remove(id);
    this._map.delete(id);
  }

  removeItem(id: string) {
    this._items.remove(id);
  }

  updateGroup(group: DataGroup) {
    this._groups.update(group);
  }

  updateItem(item: DataItem) {
    this._items.update(item);
  }

  getGroup(id: IdType) {
    return this._groups.get(id);
  }

  getItem(id: IdType) {
    return this._items.get(id);
  }

  get groups() {
    return this._groups;
  }

  get items() {
    return this._items;
  }

  get map() {
    return this._map;
  }


  startRecording(groupId: IdType, start: number) {
    //TODO: cHECK IF CURRENT ITEM STARTS WITHIN ANY OTHER ITEM
    let coincidingItem = this.findOverlappingItems(this.findItemsByOptions('group', groupId.toString()), start);
    if(coincidingItem) {
      this._map.set(groupId, {
        id: coincidingItem.id,
        recording: true,
        update: true
      });
      return coincidingItem.end;
    }
    const item = {id: this.instance(), group: groupId, content: '', start: start, end: start, type: 'range'};
    this._items.add(item);
    this._map.set(groupId, {
      id: item.id,
      recording: true,
      update: false
    });
    return start;
  }

  isRecording(id: IdType) {
    return this._map.get(id);
  }

  updateRecordings(millis: number) {
    this._groups.forEach((group, id) => {
      const status = this._map.get(id);
      if (status && status.recording) {
        const item = this._items.get(status.id);
        if (item) {
          item.end = millis;
          this._items.update(item);
        }
      }
    });
  }

  async stopRecording(groupId: IdType) {
    return await new Promise((resolve, reject) => {
      if (this._map.has(groupId)) {
        const status = this._map.get(groupId);
        if (status && status.id) {
          const item = this._items.get(status.id);
          if (item) {
            if ((this.deleteWrongRecords && item.start > item.end) || item.start == item.end) {
              this._items.remove(item.id);
              let reason = item.start == item.end?  "start and end times cant be identical": "Incorrect segment";
              reject(reason);
            }
          }
        }
        const segmentId: IdType = status.id;
        const updateExisting: boolean = status.update;
        this._map.delete(groupId);
        resolve({id: segmentId, updateExisting: updateExisting});
      } else {
        reject();
      }
    });
  }

  updateGroupCategory(newCategory: string, categoryId: string) {
    this._groups.forEach((group, id) => {
      if(group['categoryId'] === categoryId) {
        group['content'] = newCategory + '_' + group['content'].split('_')[1];
        group['category'] = newCategory;
        this._groups.update(group);
      }
    });
  }

  deleteGroupCategory(categoryId: string) {
    this._groups.forEach((group, id) => {
      if(group['categoryId'] === categoryId) {
        this.removeGroup(id.toString());
      }
    });
  }

  findItemsByOptions(idField: string, idValue: string){
    let temp = [];
    this._items.forEach( item => {
      if(item[idField] == idValue) {
        temp.push(item);
      }
    });
    return temp;
  }

  sortByCategories() {
    //TODO remove this section
    console.log(this._groups);
  }

  private findOverlappingItems(itemList: any[], start: number) {
    let overlappingItem = null;
    itemList.forEach( item => {
        if(item.start <= start && item.end >= start) {
          overlappingItem = item;
        }
    });
    return overlappingItem;
  }
}
