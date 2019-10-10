import { EventEmitter, Injectable } from '@angular/core';
import { VgAPI } from 'videogular2/core';

interface PlayerReadyEvent {
  api: VgAPI;
  index: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  playerReady = new EventEmitter<PlayerReadyEvent>();
  videoSeek = new EventEmitter<number>();

  constructor() {
  }

  onPlayerReady(api: VgAPI, index: number) {
    this.playerReady.emit({api, index});
  }

  seekTo(time: number) {
    this.videoSeek.emit(time);
  }
}
