import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { LabelsService } from './labels.service';
import * as SocketIO from 'socket.io';
import { InsertResult, UpdateResult } from 'typeorm';
import { Label } from '../entities/label.entity';
import { SegmentService } from './segment/segment.service';
import { from, Observable} from 'rxjs';
import {finalize, map, mergeAll} from 'rxjs/operators';
import { Segment } from '../entities/segment.entity';
import { LabelCategory } from '../entities/labelcategory.entity';
import { Marker } from '../entities/markers.entity';
import { MarkerService } from './trackers/marker/marker.service';

@WebSocketGateway({ origins: '*:*', namespace: 'labels', transports: ['websocket'], upgrade: false })
export class LabelsGateway  {
  @WebSocketServer() io: SocketIO.Server;

  constructor(private labelsService: LabelsService,
              private segmentService: SegmentService,
              private markerService: MarkerService) {
  }

  // region 'Project' Room join/leave
  @SubscribeMessage('joinProject')
  async joinProject(socket: SocketIO.Socket, data): Promise<true | false> {
    return await new Promise((resolve, reject) => {
      socket.join(data.id, err => {
        if (err)
          reject(err);
        else
          resolve();
      });
    }).then(() => true, () => false);
  }

  @SubscribeMessage('leaveProject')
  async leaveProject(socket: SocketIO.Socket, data): Promise<true | false> {
    return await new Promise((resolve, reject) => {
      socket.leave(data.id, err => {
        if (err)
          reject(err);
        else
          resolve();
      });
    }).then(() => true, () => false);
  }

  // endregion

  // region Labels
  @SubscribeMessage('getLabels')
  async getLabels(socket: SocketIO.Socket, data) {
    const room = Object.keys(socket.rooms)[1];
    return await this.labelsService.getLabels(room, ['id', 'name']);
  }

  @SubscribeMessage('getLabelCategories')
  async getLabelCategories(socket: SocketIO.Socket, data) {
    const room = Object.keys(socket.rooms)[1];
    return await this.labelsService.getLabelCategories(room);
  }

  @SubscribeMessage('addLabel')
  async addLabel(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    return await this.labelsService.createLabel(room, data.aid, data.cid, data.authorClass)
      .then(async (value: Label) => {
        value['categoryId'] = data.cid;
        socket.to(room).broadcast.emit('newLabels', value);
        return value;
      });
  }

  @SubscribeMessage('addLabelCategory')
  async addLabelCategory(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    return await this.labelsService.createLabelCategory(room, data.aid, data.authorClass, data.labelCategoryData)
      .then(async (value: InsertResult) => {
        const id = value.identifiers[0].id;
        const newLabelCategory: LabelCategory = await this.labelsService.getLabelCategory(id);
        socket.to(room).broadcast.emit('newLabelCategories', newLabelCategory);
        return newLabelCategory;
      });
  }

  @SubscribeMessage('deleteLabel')
  async deleteLabel(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    return await this.labelsService.deleteLabel(data.id, data.cid)
      .then(() => {
        socket.to(room).broadcast.emit('removedLabels', { id: data.id });
        return false;
      }, () => true);
  }

  @SubscribeMessage('deleteLabelCategory')
  async deleteLabelCategory(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    return await this.labelsService.deleteLabelCategory(data.id)
      .then(() => {
        socket.to(room).broadcast.emit('removedLabelCategories', { id: data.id });
        return false;
      }, () => true);
  }

  @SubscribeMessage('editLabel')
  async edit(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    const labelId = data.id;
    const changeName = data.change;

    return await this.labelsService.updateLabelName(labelId, changeName)
      .then(() => {
        socket.to(room).broadcast.emit('updatedLabels', { id: labelId, change: changeName });
        return false;
      }, () => {
        return true;
      });
  }

  @SubscribeMessage('editLabelCategory')
  async editCategory(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    const labelId = data.id;
    const changeName = data.change;

    return await this.labelsService.updateLabelCategoryName(labelId, changeName)
      .then(() => {
        socket.to(room).broadcast.emit('updatedLabelCategories', { id: labelId, change: changeName });
        return false;
      }, () => {
        return true;
      });
  }

  // endregion

  // region Segments
  @SubscribeMessage('getSegments')
  getSegments(socket: SocketIO.Socket, payload): Observable<WsResponse<Segment[]>> {
    const ids: string[] = payload.ids;
    return from(ids.map(id => this.segmentService.getSegments(id)))
      .pipe(
        mergeAll(),
        map((data: Segment[]) => {
          return ({ event: 'getSegments', data });
        }),
      );
  }

  @SubscribeMessage('addSegment')
  async addSegment(socket: SocketIO.Socket, data) {
    const labelId = data.group;
    const roomId = LabelsGateway.getProjectRoom(socket);
    const authorId = data.authorId;
    const start = data.start;
    const end = data.end;
    const authorClass = data.authorRole;
    const hyperid = data.hyperid;
    return await this.segmentService
      .createSegment(labelId, authorId, start, end, authorClass)
      .then(async (value: InsertResult) => {
        this.io.to(roomId).emit('newSegmentCreated', {data: data, id: value.identifiers[0].id});
        return value.identifiers[0].id;
      }, function (err) {
        console.log(err);
        return false;
      });
  }

  @SubscribeMessage('mergeSegments')
  async mergeSegments(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    return await this.segmentService
      .mergeSegment(data.segmentIds, data.start, data.end)
      .then(() => {
        this.io.to(room).emit("mergedSegments", {data: data});
        return false;
      }, function (err) {
        console.log(err);
        return true;
      });
  }

  @SubscribeMessage('deleteSegments')
  async deleteSegments(socket: SocketIO.Socket, data) {
    const ids: string = data.items[0];
    return await this.segmentService.deleteSegment(ids).then(() => {
      const room = LabelsGateway.getProjectRoom(socket);
      this.io.to(room).emit("segmentDeleted", {data: ids});
      return false;
    }, function (err) {
      console.log("Deleting segments error"+err);
      return true;
    });
  }

  @SubscribeMessage('getMarkers')
  getMarkers(socket: SocketIO.Socket, payload): Observable<WsResponse<Marker[]>> {
    const ids: string[] = payload.ids;
    return from(ids.map(id => this.markerService.getMarkers(id)))
      .pipe(
        mergeAll(),
        map((data: Marker[]) => {
          return ({ event: 'getMarkers', data });
        }),
      );
  }

  @SubscribeMessage('addMarker')
  addMarker(socket: SocketIO.Socket, payload): Observable<WsResponse<any[]>> {
    const markers: {completed: boolean; start: number; labelId: any, authorId: string, authorClass: string, segmentId: any}[] = payload.markers;
    return from(markers.map(marker => this.markerService.addMarker(marker)))
      .pipe(
        mergeAll(),
        map((data: any, index) => {
          if(data) {
            const room = LabelsGateway.getProjectRoom(socket);
            this.markerService.addMarkerDataToTracker(data['ops'][0].trackerId, data["ops"][0]._id.toString()).then(r => {});
            this.io.to(room).emit("newMarkersCreated", {data: data["ops"]});
            if(index == markers.length -1) {
              return ({ event: 'addMarker',  data: {data: data["ops"], firstMarkerTime: payload.firstMarkerTime}});
            }
            return ({ event: 'addMarker',  data: data["ops"]});
          }
        }),
      );
  }

  @SubscribeMessage('deleteMarkers')
  async deleteMarkers(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    const ids: string = data.items[0];
    return await this.markerService.deleteMarkers(ids, "segmentId").then((response) => {
      if(response) {
        socket.to(room).broadcast.emit('deleteMarkers ', { data: response });
        return response;
      }
    }, function (err) {
      console.log("Deleting Marker error"+err);
      return true;
    });
  }

  async triggerYoloGeneratedLabels(projectId: string) {
    this.io.to(projectId).emit('yoloRecommendations', {data: []});
    //this.io.sockets.to(projectId).emit('yoloRecommendations', {data: []});
  }

// region

  private static getProjectRoom(socket: SocketIO.Socket) {
    return Object.keys(socket.rooms)[1];
  }
}
