import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { LabelsService } from './labels.service';
import * as SocketIO from 'socket.io';
import { InsertResult } from 'typeorm';
import { Label } from '../entities/label.entity';
import { SegmentService } from './segment/segment.service';
import { from, Observable} from 'rxjs';
import { map, mergeAll } from 'rxjs/operators';
import { Segment } from '../entities/segment.entity';
import { ObjectID } from 'mongodb';
import { config } from '../../config';

@WebSocketGateway({ origins: '*:*', namespace: 'labels' })
export class LabelsGateway  {
  @WebSocketServer() io: SocketIO.Server;

  constructor(private labelsService: LabelsService,
              private segmentService: SegmentService) {
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

  @SubscribeMessage('addLabel')
  async addLabel(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    return await this.labelsService.createLabel(room, data.aid)
      .then(async (value: InsertResult) => {
        const id = value.identifiers[0].id;
        const newLabel: Label = await this.labelsService.getLabel(id);
        socket.to(room).broadcast.emit('newLabels', newLabel);
        return newLabel;
      });
  }

  @SubscribeMessage('deleteLabel')
  async deleteLabel(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    return await this.labelsService.deleteLabel(data.id)
      .then(() => {
        socket.to(room).broadcast.emit('removedLabels', { id: data.id });
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
    const room = LabelsGateway.getProjectRoom(socket);
    const labelId = data.group;
    const authorId = '';
    const start = data.start;
    const end = data.end;
    const hyperid = data.hyperid;
    return await this.segmentService
      .createSegment(labelId, authorId, start, end)
      .then(() => {
        return false;
      }, () => {
        return true;
      });
  }

  @SubscribeMessage('deleteSegments')
  async deleteSegments(socket: SocketIO.Socket, data) {
    const room = LabelsGateway.getProjectRoom(socket);
    const ids: string[] = data.items;
    ids.forEach(async id =>
      await this.segmentService.deleteSegment(id).then(value => {
        return false;
      }));
  }

// region

  private static getProjectRoom(socket: SocketIO.Socket) {
    return Object.keys(socket.rooms)[1];
  }
}
