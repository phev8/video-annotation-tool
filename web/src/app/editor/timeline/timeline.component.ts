import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import * as vis from 'vis';
import { DataGroup, IdType, Timeline, TimelineOptions } from 'vis';
import * as moment from 'moment';
import { LabelsService } from 'src/app/labels/labels.service';
import { CurrentProjectService } from '../current-project.service';
import { VideoService } from '../../video/video.service';
import { Subscription } from 'rxjs';
import { IMediaSubscriptions } from 'videogular2/src/core/vg-media/i-playable';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { ProjectModel } from '../../models/project.model';
import { Time } from './time';
import { TimelineData } from './timeline.data';
import { LabelModel } from '../../models/label.model';
import { pairwise, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('timeline_visualization') timelineVisualization: ElementRef;

  loading = true;
  private project: ProjectModel;


  private timeline: Timeline;

  // noinspection SpellCheckingInspection
  // noinspection JSUnusedGlobalSymbols
  private options = {
    width: '100%',
    min: Time.seconds(0),
    start: Time.seconds(0),
    end: Time.seconds(15),
    max: Time.seconds(98), // todo
    moment: function (date) {
      return moment(date).utc();
    },
    format: {
      minorLabels: {
        millisecond: 'ss.SSS',
        second: 'HH:mm:ss',
        minute: 'HH:mm:ss',
        hour: 'HH:mm',
        weekday: 'HH:mm',
        day: 'HH:mm',
        week: 'HH:mm',
        month: 'HH:mm',
        year: 'HH:mm'
      },
      majorLabels: {
        // millisecond: 'HH:mm:ss',
        // second: 'D MMMM HH:mm',
        // minute: 'ddd D MMMM',
        // hour: 'ddd D MMMM',
        // weekday: 'MMMM YYYY',
        // day: 'MMMM YYYY',
        // week: 'MMMM YYYY',
        // month: 'YYYY',
        // year: '',
        // millisecond: 'HH:mm:ss',
        second: 'HH:mm:ss',
        minute: 'HH:mm:ss',
        hour: '',
        weekday: '',
        day: '',
        week: '',
        month: '',
        year: ''
      }
    },
    groupTemplate: (group: DataGroup) => {
      if (group) {
        const container = document.createElement('div');
        container.className = 'checkbox btn';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `checkbox_${group.id}`;
        input.addEventListener('change', () => {
          this.checkboxChange.emit({id: group.id, checked: input.checked});
        });

        const label = document.createElement('label');
        label.setAttribute('for', `checkbox_${group.id}`);
        label.innerHTML = group.content;

        container.prepend(input);
        container.append(label);
        return container;
      }
    },
    multiselect: true,
    editable: true,
    onAdd: (item, callback) => {
      console.log('onAdd', item);
      callback(item); // send back adjusted new item
      // callback(null) // cancel item creation
    },
    onMove: (item, callback) => {
      console.log('onMove', item);
      callback(item);
    },
    onMoving: (item, callback) => {
      console.log('onMoving', item);
      callback(item);
    },
    onUpdate: (item, callback) => {
      console.log('onUpdate', item);
      callback(item);
    },
    onRemove: (item, callback) => {
      console.log('onRemove', item);
      callback(item);
    },
    tooltipOnItemUpdateTime: {
      template: item => {
        const fstart = Time.formatDatetime(item.start);
        const fend = Time.formatDatetime(item.end);
        return `Start: ${fstart}<br>End:${fend}`;
      }
    },
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap'
    }
  };

  private timelineData: TimelineData = new TimelineData();
  private customTimeId: IdType;
  private subscription: Subscription;
  private currentTime = 0;

  private checkboxChange = new EventEmitter<{ id: IdType, checked: boolean }>();

  constructor(private projectService: CurrentProjectService,
              private labelsService: LabelsService,
              private videoService: VideoService,
              private hotkeyService: HotkeysService,
              private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.subscription = this.projectService.getCurrentProject$()
      .subscribe(project => {
        if (project) {
          this.project = project;
          this.labelsService.getLabels()
            .then((labels: LabelModel[]) => {
              this.labelsService.getSegments(labels.map(x => {
                return x.id;
              }));
              // this.timelineData.clear();
              this.timelineData.addGroups(labels.map(x => ({id: x.id, content: x.name})));
              // this.timelineData.addItem({id: '-1', content: `stub`, start: 0, end: 100, type: 'range'});
            });
        }
      });
    this.observeLabels();
    this.observeSegments();

    this.subscription.add(this.videoService.playerReady
      .subscribe(event => {
        const api = event.api;
        const index = event.index;
        if (api && index === 0) {
          const subscriptions: IMediaSubscriptions = api.subscriptions;

          this.subscription.add(subscriptions.canPlay.subscribe(() => {
            this.updateCurrentTime(Time.seconds(api.currentTime));
          }));

          this.subscription.add(subscriptions.timeUpdate.subscribe(() => {
            this.updateCurrentTime(Time.seconds(api.currentTime));
          }));

          this.subscription.add(subscriptions.durationChange.subscribe(() => {
            this.setMax(Time.seconds(api.duration));
          }));
        }
      }));

    this.subscription.add(this.checkboxChange
      .pipe(
        startWith({id: undefined, checked: false}),
        pairwise()
      )
      .subscribe(e => {
        const prev = e[0];
        const curr = e[1];

        if (prev && prev.id === undefined) {
          this.timelineData.startRecording(curr.id, this.currentTime);
        } else if (curr.checked) {
          this.timelineData.startRecording(curr.id, this.currentTime);
        } else if (!curr.checked) {
          this.timelineData.stopRecording(curr.id)
            .then((id: IdType) => {
              const item = this.timelineData.items.get(id);
              if (item) {
                const segment = {
                  hyperid: item.id,
                  group: item.group,
                  start: item.start,
                  end: item.end
                };
                this.labelsService.addSegment(segment).then(() => {
                  console.log('segment added');
                }, () => {
                  console.error('an error occured while adding a segment');
                });
              }
            });
        }
      }));

  }

  ngAfterViewInit() {
    const container = this.timelineVisualization.nativeElement;
    // @ts-ignore
    this.timeline = new vis.Timeline(container, this.timelineData.items, this.timelineData.groups, this.options);
    this.customTimeId = this.timeline.addCustomTime(Time.seconds(1), 'currentPlayingTime');
    this.timeline.setCustomTimeTitle('', this.customTimeId);


    this.timeline.on('timechanged', properties => {
      const videoSeek = Time.dateToTotalCentiSeconds(properties.time);
      this.videoService.seekTo(videoSeek);
      // this.timeline.setCustomTimeTitle(time.formatDatetime('H:mm:ss'), id); todo
    });

    this.timelineData.items.on('remove', (event, properties) => {
      if (event === 'remove') {
        const ids = properties.items;
        this.labelsService.deleteSegments(ids);
      }
    });

    this.loading = false;
    this.changeDetectorRef.detectChanges();

    this.registerHotkeys();

    // force a timeline redraw, because sometimes it does not detect changes
    setTimeout(() => this.timeline.redraw(), 250);
  }

  updateCurrentTime(millis: number) {
    // console.log(millis);
    this.currentTime = millis;

    this.timeline.setCustomTime(millis, this.customTimeId);
    const start = this.timeline.getWindow().start.getTime();
    const end = this.timeline.getWindow().end.getTime();

    const delta = 3 * (end - start) / 4; // center
    if (millis < start || end < millis + delta) {
      this.timeline.moveTo(millis, {animation: false});
      // this.timeline.moveTo(millis + (end - start) - (end - start) / 6);
    }

    this.timelineData.updateRecordings(millis);
  }

  ngOnDestroy(): void {
    if (this.timeline) {
      this.timeline.destroy();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private observeLabels() {
    this.subscription.add(this.labelsService.newLabels$().subscribe(newLabel => {
      if (newLabel) {
        const group = {id: newLabel.id, content: newLabel.name};
        this.timelineData.addGroup(group);
      }
    }));

    this.subscription.add(this.labelsService.removedLabels$().subscribe(removed => {
      if (removed) {
        this.timelineData.removeGroup(removed.id);
      }
    }));

    this.subscription.add(this.labelsService.editedLabels$().subscribe(changed => {
        if (changed) {
          this.timelineData.updateGroup({id: changed.id, content: changed.change});
        }
      })
    );
  }

  private observeSegments() {
    this.subscription.add(
      this.labelsService.getSegments$()
        .subscribe(
          xs => this.timelineData.items.add(xs.map(x => ({
            id: x.id,
            content: '',
            group: x.labelId,
            start: x.start,
            end: x.end
          })))
        )
    );
  }

  private registerHotkeys() {
    const hotkeys = [];
    for (let i = 0; i < 9; ++i) {
      const hotkey = new Hotkey(
        `${i + 1}`,
        (): boolean => {
          const ids: IdType[] = this.timelineData.getGroupIds();
          const id = ids[i];
          const checkbox = document.getElementById(`checkbox_${id}`);
          if (checkbox) {
            checkbox.click();
          }
          return false;
        },
        undefined,
        `Toggle recording of the ${i + 1} label`);
      hotkeys.push(hotkey);
    }
    this.hotkeyService.add(hotkeys);

    const del = new Hotkey(
      `del`,
      (): boolean => {
        setTimeout(() => this.deleteSelecion(), 0);
        return false;
      },
      undefined,
      `Delete selected segments`);

    this.hotkeyService.add(del);
  }

  private setMax(duration: number) {
    // @ts-ignore
    const newOptions: TimelineOptions = Object.assign({}, this.options);
    newOptions.max = duration;
    this.timeline.setOptions(newOptions);
  }

  private deleteSelecion() {
    const selection = this.timeline.getSelection();
    if (selection && selection.length > 0) {
      if (confirm('Are you sure you want to delete selected segments?')) {
        this.timelineData.items.remove(selection);
      }
    }
  }
}
