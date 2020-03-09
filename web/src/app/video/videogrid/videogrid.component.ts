import { Component, OnDestroy, OnInit, QueryList, ViewChildren, ElementRef, ViewChild } from '@angular/core';
import { VgAPI } from 'videogular2/core';
import { IVideo } from '../video.interface';
import { CurrentProjectService } from '../../editor/current-project.service';
import { LinkedList } from 'typescript-collections';
import { IMediaSubscriptions } from 'videogular2/src/core/vg-media/i-playable';
import { VideoService } from '../video.service';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { Subscription } from 'rxjs';
import { VideoComponent } from '../video/video.component';
import {CurrentToolService} from "../../editor/project-toolbox.service";
import {CanvasService} from "../../canvas/canvas.service";

@Component({
  selector: 'app-videogrid',
  templateUrl: './videogrid.component.html',
  styleUrls: ['./videogrid.component.scss']
})
export class VideogridComponent implements OnInit, OnDestroy {

  private _videoSources: IVideo[] = [];
  private apis: LinkedList<VgAPI> = new LinkedList<VgAPI>();
  private currentTimes: number[] = [];
  private durations: number[] = [];
  private cursorSound = false;
  // private guard = 0;
  private isPlaying = false;
  private lastMouseLeft = 0;
  private playbackIndex = 3;
  private playbackValues: string[] = ['0.25', '0.5', '0.75', '1.0', '1.25', '1.50', '1.75', '2.0', '3.0'];
  private subscription: Subscription;
  private mainIndex = 0;
  private dimensions: string = '';
  private singleMedia: boolean;
  loading = true;

  // 'main' video index
  @ViewChildren(VideoComponent) videos: QueryList<VideoComponent>;
  ratio = '2:1';

  constructor(private videoService: VideoService,
              private editorService: CurrentProjectService,
              private hotkeysService: HotkeysService,
              private elRef: ElementRef,
              private toolBoxService: CurrentToolService,
              private canvasService: CanvasService) {
    this.registerHotkeys();
  }

  ngOnInit() {
    this.subscription = this.editorService.getCurrentProject$().subscribe(project => {
      if (project) {
        this.loading = false;
        this.singleMedia = project.singleMedia;

        /** Gather all videoSources */
        const videos: IVideo[] = [];
        project.fileTree.children.forEach((child => {
          if (child.mimetype.startsWith('video')) {
            videos.push({source: child.filename});
          }
        }));
        this.dimensions = project.videoDimensions;
        this._videoSources = videos;
        this.durations = new Array<number>(videos.length);
        this.currentTimes = new Array<number>(videos.length);
      }
    });

    this.subscription.add(this.videoService.videoSeek.subscribe(x => this.seekTime(x)));
  }

  onPlayerReady(api: VgAPI, index: number) {
    this.apis.add(api);
    this.videoService.onPlayerReady(api, index);

    const subscriptions: IMediaSubscriptions = api.subscriptions;

    this.subscription.add(subscriptions.canPlay.subscribe(() => {
      this.currentTimes[index] = api.currentTime;
    }));

    this.subscription.add(subscriptions.timeUpdate.subscribe(() => {
      this.currentTimes[index] = api.currentTime;
    }));

    this.subscription.add(subscriptions.durationChange.subscribe(() => {
      this.durations[index] = api.duration;
    }));

    this.subscription.add(subscriptions.loadedMetadata.subscribe((x) => {
      const width = x.target.videoWidth;
      const height = x.target.videoHeight;

      if (height > width) {
        if(this.dimensions && this.dimensions != '') this.ratio = '' + this.dimensions.split(' ')[0];
        else this.ratio = '1:2';
      }

      if(this.singleMedia) {
        if(this.dimensions && this.dimensions != '') this.ratio = '' + this.dimensions.split(' ')[0];
        else this.ratio = "" + (this.elRef.nativeElement.parentElement.clientHeight - 50);
      }
    }));
  }


  // region Mouse
  onMouseEnter(i: number) {
    if (this.cursorSound) {
      this.apis.elementAtIndex(i).volume = 1;
    }
  }

  onMouseLeave(i: number) {
    if (this.cursorSound) {
      this.apis.elementAtIndex(i).volume = 0;
      this.lastMouseLeft = i;
    }
  }

  onGlobalMouseLeave() {
    if (this.cursorSound) {
      const api: VgAPI = this.apis.elementAtIndex(this.lastMouseLeft);
      api.volume = 1;
    }
  }

  // endregion

  // region Video Controls
  seekTime(value) {
    // if (this.guard % 2 === 0) {
    //   /** This funny logic is due to a bug on Webkit-based browsers, leading to change firing twice */
    //   this.guard += 1;
    this.apis.forEach((api: VgAPI) => {
      api.seekTime(value);
    });
    // } else {
    //   this.guard = 0;
    // }
  }

  onPlayPause() {
    console.log("Play pause?");
    this.toolBoxService.triggerToolBox(false);
    this.toolBoxService.triggerCanvas(null);
    this.toolBoxService.updateItemSelectStatus(false);
    if (!this.isPlaying) {
      this.onPlay();
    } else {
      this.onPause();
    }
  }

  onPlay() {
    if (this.apis) {
      this.apis.forEach((api: VgAPI) => {
        api.play();
      });
      this.isPlaying = true;
    }
  }

  onPause() {
    this.apis.forEach((api: VgAPI) => {
      api.pause();
    });
    this.isPlaying = false;
  }

  nextPlaybackSpeed() {
    this.playbackIndex = (this.playbackIndex + 1) % this.playbackValues.length;
    this.apis.forEach((api: VgAPI) => {
      api.playbackRate = (this.playbackValues[this.playbackIndex]);
    });
  }

  previousPlaybackSpeed() {
    this.playbackIndex = (this.playbackIndex - 1) % this.playbackValues.length;
    if (this.playbackIndex < 0) {
      this.playbackIndex = this.playbackValues.length - 1;
    }
    this.apis.forEach((api: VgAPI) => {
      api.playbackRate = (this.playbackValues[this.playbackIndex]);
    });
  }

  getPlaybackValue() {
    return this.playbackValues[this.playbackIndex];
  }

  // endregion


  get videoSources(): IVideo[] {
    return this._videoSources;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getDuration() {
    const duration: number = this.durations[this.mainIndex];
    return duration ? Number.isNaN(duration) ? 0 : duration : 0;
  }

  getCurrentTime() {
    const currentTime: number = this.currentTimes[this.mainIndex];
    return currentTime ? Number.isNaN(currentTime) ? 0 : currentTime : 0;
  }

  registerHotkeys() {
    const playVideoHotkey = new Hotkey('space', (): boolean => {
      this.onPlayPause();
      return false;
    }, undefined, 'Play the video(s)');
    const nextPlayback = new Hotkey('shift+period', (): boolean => {
      this.nextPlaybackSpeed();
      return false;
    }, undefined, 'Next playback speed');
    const prevPlayback = new Hotkey('shift+comma', (): boolean => {
      this.nextPlaybackSpeed();
      return false;
    }, undefined, 'Previous playback speed');
    const cursorSound = new Hotkey('alt+j', (): boolean => {
      this.cursorSound = !this.cursorSound;
      return false;
    }, undefined, `Follow the mouse cursor to listen to the audio`);

    const back = new Hotkey('left', (): boolean => {
      this.resetCanvas();
      this.seekTime(this.getCurrentTime() - 5);
      return false;
    }, undefined, '5 seconds back');

    const windback = new Hotkey('shift+left', (): boolean => {
      this.resetCanvas();
      this.seekTime(this.getCurrentTime() - 15);
      return false;
    }, undefined, '15 seconds back');

    const forward = new Hotkey('right', (): boolean => {
      this.resetCanvas();
      this.seekTime(this.getCurrentTime() + 5);
      return false;
    }, undefined, '5 seconds forward');

    const windforward = new Hotkey('shift+right', (): boolean => {
      this.resetCanvas();
      this.seekTime(this.getCurrentTime() + 15);
      return false;
    }, undefined, '15 seconds forward');

    [playVideoHotkey, nextPlayback, prevPlayback, cursorSound, back, windback, forward, windforward]
      .forEach(hotkey => this.hotkeysService.add(hotkey));
  }

  onResize($event) {
    this.ngOnInit();
  }

  resetCanvas() {
    this.toolBoxService.triggerToolBox(false);
    this.toolBoxService.triggerCanvas(null);
    this.toolBoxService.updateItemSelectStatus(false);
  }
}
