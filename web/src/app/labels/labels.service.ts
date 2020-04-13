import { Injectable } from '@angular/core';
import { LabelsSocket } from './labels.socket';
import { merge, Observable, Subject } from 'rxjs';
import { LabelModel } from '../models/label.model';
import { DateType, IdType } from 'vis';
import { SegmentModel } from '../models/segment.model';
import { LabelCategoryModel } from '../models/labelcategory.model';
import { LabelMetadataModel } from '../models/labeltracking.model';
import { MarkerModel } from '../models/marker.model';

interface ILabelRemoved {
  id: string;
}

interface ISegmentUpdated {
  updatedIds: string[];
  newStart: number;
  newEnd: number;
}

interface ILabelCategoryRemoved {
  id: string;
}

interface ILabelEditName {
  id: string;
  change: string;
}

interface ILabelCategoryEditName {
  id: string;
  change: string;
}

@Injectable({
  providedIn: 'root'
})
export class LabelsService {

  private newLabelSubject = new Subject<LabelModel>();
  private newLabelCategorySubject = new Subject<LabelCategoryModel>();
  private deleteLabelSubject = new Subject<ILabelRemoved>();
  private deleteLabelCategorySubject = new Subject<ILabelCategoryRemoved>();
  private editedLabelsSubject = new Subject<ILabelEditName>();
  private editedLabelCategoriesSubject = new Subject<ILabelCategoryEditName>();


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
   * Get all label categories in this project
   */
  getLabelCategories(): Promise<LabelCategoryModel[]> {
    return new Promise((resolve) => {
      this.socket.emit('getLabelCategories', undefined, (value) => resolve(value));
    });
  }

  /**
   * Add a label to this project
   * @param authorId - the ID of the author
   */
  addLabel(authorId: string = '', categoryId: string, authorClass: string) {
    return new Promise(resolve => {
      this.socket.emit('addLabel', {aid: authorId, cid: categoryId, authorClass: authorClass}, (label: LabelModel) => {
        resolve(label);
        this.newLabelSubject.next(label);
      });
    });
  }

  /**
   * Add a label to this project
   * @param authorId - the ID of the author
   */
  addLabelCategory(authorId: string = '', authorClass: string) {
    return new Promise(resolve => {
      this.socket.emit('addLabelCategory', {aid: authorId, authorClass: authorClass}, (label: LabelCategoryModel) => {
        resolve(label);
        this.newLabelCategorySubject.next(label);
      });
    });
  }

  /**
   * Add a label to this project
   * @param authorId - the ID of the author
   */
  addNewLabelCategory(authorId: string = '', authorClass: string, labelCategoryData: LabelMetadataModel) {
    return new Promise(resolve => {
      this.socket.emit('addLabelCategory', {aid: authorId, authorClass: authorClass, labelCategoryData: labelCategoryData}, (label: LabelCategoryModel) => {
        resolve(label);
        this.newLabelCategorySubject.next(label);
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
   * Update the name of a label Category
   * @param id of this label
   * @param newName - a new name to be assigned to this label
   */
  async editLabelCategory(id: string, newName: string) {
    return await new Promise(((resolve, reject) => {
      this.socket.emit('editLabelCategory', {id, change: newName}, (err) => {
        if (err) {
          reject();
        } else {
          resolve({id, change: newName});
          this.editedLabelCategoriesSubject.next({id, change: newName});
        }
      });
    }));
  }

  /**
   * Delete the label by id
   * @param id of this label
   */
  deleteLabel(id: string, categoryId?: string) {
    return new Promise((resolve, reject) => {
      this.socket.emit('deleteLabel', {id: id, cid: categoryId}, (err) => {
        if (!err) {
          resolve();
          this.deleteLabelSubject.next({id});
        } else {
          reject();
        }
      });
    });
  }

  /**
   * Delete the label category by id
   * @param id of this label
   */
  deleteLabelCategory(id: string) {
    return new Promise((resolve, reject) => {
      this.socket.emit('deleteLabelCategory', {id}, (err) => {
        if (!err) {
          resolve();
          this.deleteLabelCategorySubject.next({id});
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

  addSegment(p: { hyperid: IdType; group: string; start: DateType; end: DateType, authorRole: string, authorId: string }) {
    return new Promise(((resolve, reject) => {
      this.socket.emit('addSegment', p, function (response) {
        if (response) {
          resolve(response);
        } else {
          reject();
        }
      });
    }));
  }

  deleteSegments(ids: IdType[]) {
    return new Promise(((resolve, reject) => {
      this.socket.emit('deleteSegments', {items: ids}, (response) => {
        if (!response) {
          console.log(response);
          resolve(this.deleteMarkersForSegments(ids));
        } else {
          reject();
        }
      });
    }));
  }

  // endregion

  // region Broadcast
  newLabels$(): Observable<LabelModel> {
    return merge(
      this.socket.fromEvent<LabelModel>('newLabels'),
      this.newLabelSubject.asObservable()
    );
  }

  newLabelCategories$(): Observable<LabelCategoryModel> {
    return merge(
      this.socket.fromEvent<LabelCategoryModel>('newLabelCategories'),
      this.newLabelCategorySubject.asObservable()
    );
  }

  removedLabels$(): Observable<ILabelRemoved> {
    return merge(
      this.socket.fromEvent<ILabelRemoved>('removedLabels'),
      this.deleteLabelSubject.asObservable()
    );
  }

  removedLabelCategories$(): Observable<ILabelRemoved> {
    return merge(
      this.socket.fromEvent<ILabelCategoryRemoved>('removedLabelCategories'),
      this.deleteLabelCategorySubject.asObservable()
    );
  }

  editedLabels$(onlyExternalChanges: boolean = false) {
    const ws = this.socket.fromEvent<ILabelEditName>('updatedLabels');
    return onlyExternalChanges ? ws : merge(ws, this.editedLabelsSubject.asObservable());
  }

  editedLabelCategories$(onlyExternalChanges: boolean = false) {
    const ws = this.socket.fromEvent<ILabelCategoryEditName>('updatedLabelCategories');
    return onlyExternalChanges ? ws : merge(ws, this.editedLabelCategoriesSubject.asObservable());
  }

  // endregion


  mergeSegments(segmentIds: any, start: any, end: any) {
    return new Promise(((resolve, reject) => {
      this.socket.emit('mergeSegments', {segmentIds, start, end}, (err) => {
        if (!err) {
          resolve();
        } else {
          console.log(err);
          reject();
        }
      });
    }));
  }

  //markers sections
  getMarkers(ids: IdType[]) {
    this.socket.emit('getMarkers', {ids});
  }

  getMarkers$(): Observable<MarkerModel[]> {
    return this.socket.fromEvent('getMarkers');
  }


  newTrackingInstance(markers: { completed: boolean; start: number; labelId: any; authorId: string; authorClass: string; segmentId: any }[], firstMarkerTime: number) {
    this.socket.emit('addMarker', {markers, firstMarkerTime});
  }

  newMarkers$(): Observable<any[]> {
    return this.socket.fromEvent('addMarker');
  }

  deleteMarkersForSegments(ids: IdType[]) {
    return new Promise(((resolve, reject) => {
      this.socket.emit('deleteMarkers', {items: ids}, (response) => {
        if (response) {
          console.log(response);
          resolve(response);
        } else {
          reject();
        }
      });
    }));
  }

  deleteMarkers$(): Observable<any[]> {
    return this.socket.fromEvent('deleteMarkers');
  }

  newSegments$(): Observable<any> {
    return this.socket.fromEvent('newSegmentCreated');
  }

  deletedSegments$(): Observable<any> {
    return this.socket.fromEvent('segmentDeleted');
  }

  mergedSegments$(): Observable<any> {
    return this.socket.fromEvent('mergedSegments');
  }

  newMarkersCreated$(): Observable<any> {
    return this.socket.fromEvent('newMarkersCreated');
  }

  systemRecommendations$(): Observable<any[]> {
    return this.socket.fromEvent('yoloRecommendations');
  }

}
