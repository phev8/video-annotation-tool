import { EventEmitter, Injectable } from '@angular/core';
import { LabelsSocket } from './labels.socket';
import { merge, Observable, Subject } from 'rxjs';
import { LabelModel } from '../models/label.model';
import { joinTestLogs } from 'protractor/built/util';
import { DateType, IdType } from 'vis';
import { SegmentModel } from '../models/segmentModel';

interface ILabelRemoved {
  id: string;
}

interface ILabelEditName {
  id: string;
  change: string;
}

@Injectable({
  providedIn: 'root'
})
export class LabelsService {

  private newLabelSubject = new Subject<LabelModel>();
  private deleteLabelSubject = new Subject<ILabelRemoved>();
  private editedLabelsSubject = new Subject<ILabelEditName>();

  private lastProjectId;


  constructor(private socket: LabelsSocket) {
    this.socket.on('connect', () => {
      console.log('connect');
      if (this.lastProjectId) {
        this.joinProject(this.lastProjectId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('disconnect');
    });
  }

  /**
   * Join a comm room associated with the project
   * @param id of the project to be joined into
   */
  joinProject(id) {
    this.socket.emit('joinProject', {id});
  }

  /**
   * Leave a comm room associated with the project
   * @param id of the project to be left from
   */
  leaveProject(id) {
    this.socket.emit('leaveProject', {id});
  }

  // region Unicast Labels

  /**
   * Get all labels in this project
   */
  getLabels(): Promise<LabelModel[]> {
    return new Promise((resolve) => {
      this.socket.emit('getLabels', undefined, (value) => resolve(value));
    });
  }

  /**
   * Add a label to this project
   * @param authorId - the ID of the author
   */
  addLabel(authorId: string = '') {
    return new Promise(resolve => {
      this.socket.emit('addLabel', {aid: authorId}, (label: LabelModel) => {
        resolve(label);
        this.newLabelSubject.next(label);
      });
    });
  }

  /**
   * Update the name of a label
   * @param id of this label
   * @param newName - a new name to be assigned to this label
   */
  async editLabel(id: string, newName: string) {
    return await new Promise(((resolve, reject) => {
      this.socket.emit('editLabel', {id, change: newName}, (err) => {
        if (err) {
          reject();
        } else {
          resolve({id, change: newName});
          this.editedLabelsSubject.next({id, change: newName});
        }
      });
    }));
  }

  /**
   * Delete the label by id
   * @param id of this label
   */
  deleteLabel(id: string) {
    return new Promise((resolve, reject) => {
      this.socket.emit('deleteLabel', {id}, (err) => {
        if (!err) {
          resolve();
          this.deleteLabelSubject.next({id});
        } else {
          reject();
        }
      });
    });
  }

  // endregion

  // region Unicast Segments
  getSegments(ids: IdType[]) {
    this.socket.emit('getSegments', {ids});
  }

  getSegments$(): Observable<SegmentModel[]> {
    return this.socket.fromEvent('getSegments');
  }

  addSegment(p: { hyperid: IdType; group: string; start: DateType; end: DateType }) {
    console.log(p);
    return new Promise(((resolve, reject) => {
      this.socket.emit('addSegment', p, (err) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
    }));
  }

  deleteSegments(ids: IdType[]) {
    this.socket.emit('deleteSegments', {items: ids}, (response) => {
      console.log(response);
    });
  }

  // endregion

  // region Broadcast
  newLabels$(): Observable<LabelModel> {
    return merge(
      this.socket.fromEvent<LabelModel>('newLabels'),
      this.newLabelSubject.asObservable()
    );
  }

  removedLabels$(): Observable<ILabelRemoved> {
    return merge(
      this.socket.fromEvent<ILabelRemoved>('removedLabels'),
      this.deleteLabelSubject.asObservable()
    );
  }

  editedLabels$(onlyExternalChanges: boolean = false) {
    const ws = this.socket.fromEvent<ILabelEditName>('updatedLabels');
    return onlyExternalChanges ? ws : merge(ws, this.editedLabelsSubject.asObservable());
  }

  // endregion


}
