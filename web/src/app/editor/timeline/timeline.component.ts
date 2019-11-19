import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit, Output,
  ViewChild,
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
import { LabelCategoryModel } from '../../models/labelcategory.model';
import { element } from 'protractor';
import { CurrentToolService } from '../project-toolbox.service';

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

  @Output() showToolBox = new EventEmitter<boolean>();

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

        const overarchingContainer = document.createElement('div');
        overarchingContainer.className = 'clr-row top-margin';

        const containerLeft = document.createElement('div');
        containerLeft.className = 'clr-col-6';

        const containerRight = document.createElement('div');
        containerRight.className = 'clr-col-6';


        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'btn btn-link';


        //const categoryInput = document.createElement('input');
        //categoryInput.type = 'checkbox';
        //categoryInput.id = `checkbox_as1`;
        //categoryInput.id = `checkbox_${group.id}`;
        const categoryLabel = document.createElement('label');
        categoryLabel.innerHTML = group['category'];
        categoryLabel.addEventListener('click', () => {
          this.labelsService.addLabel(JSON.parse(localStorage.getItem('currentSession$'))['user']['id'],group['categoryId'], this.userRole);
        });

        //categoryContainer.prepend(categoryInput);
        categoryContainer.append(categoryLabel);

        const container = document.createElement('div');
        container.className = 'checkbox btn';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `checkbox_${group.id}`;
        input.addEventListener('change', () => {
          this.checkForTracking(group['categoryId']);
          this.checkboxChange.emit({id: group.id, checked: input.checked});
        });

        const label = document.createElement('label');
        label.setAttribute('style', 'padding-right: 2em;');
        label.setAttribute('for', `checkbox_${group.id}`);
        label.innerHTML = group.content;

        container.prepend(input);
        container.append(label);

        containerLeft.appendChild(categoryContainer);
        containerRight.appendChild(container);

        overarchingContainer.appendChild(containerLeft);
        overarchingContainer.appendChild(containerRight);
        // container.append(temp);
        return overarchingContainer;
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
  private labelCategories: LabelCategoryModel[] = [];
  private customTimeId: IdType;
  private subscription: Subscription;
  private currentTime = 0;

  private checkboxChange = new EventEmitter<{ id: IdType, checked: boolean }>();
  private userRole: string;

  constructor(private projectService: CurrentProjectService,
              private labelsService: LabelsService,
              private videoService: VideoService,
              private hotkeyService: HotkeysService,
              private changeDetectorRef: ChangeDetectorRef,
              private toolBoxService: CurrentToolService) {
  }

  ngOnInit(): void {
    this.subscription = this.projectService.getCurrentProject$()
      .subscribe(project => {
        if (project) {
          this.project = project;
          this.userRole = this.projectService.findUserRole(project, JSON.parse(localStorage.getItem('currentSession$'))['user']['id']);

          /*this.labelsService.getLabels()
            .then((labels: LabelModel[]) => {
              this.labelsService.getSegments(labels.map(x => {
                return x.id;
              }));
              // this.timelineData.clear();
              this.timelineData.addGroups(labels.map(x => ({id: x.id, content: x.name})));
              // this.timelineData.addItem({id: '-1', content: `stub`, start: 0, end: 100, type: 'range'});
            });*/

          this.labelsService.getLabelCategories()
            .then((labelCategories: LabelCategoryModel[]) => {
              labelCategories.map(labelCategory => {
                this.labelsService.getSegments(labelCategory.labels.map(x => {return x["_id"]}));
                this.timelineData.addGroups(labelCategory.labels.map(x => ({id: x["_id"], content: x.name, category: labelCategory.name, categoryId: labelCategory.id})));
                this.labelCategories.push(labelCategory);
              });
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
                  end: item.end,
                  authorRole: this.userRole,
                  authorId: JSON.parse(localStorage.getItem('currentSession$'))['user']['id']
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
    setTimeout(() => {
      this.timeline.redraw();
      let elements = document.getElementsByClassName('vis-inner');

      // @ts-ignore
      for (let item of elements) {
        item.setAttribute('style', 'display: block;');
      }
    }, 250);
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
        let category: LabelCategoryModel = this.labelCategories.find(value => value.id == newLabel['categoryId'] );
        if(category!= null) {
          category.labels.push(newLabel);
          const group = {id: newLabel.id, content: newLabel.name, category: category.name, categoryId: category.id};
          this.timelineData.addGroup(group);
          this.timelineData.sortByCategories();
        }
      }
    }));

    this.subscription.add(this.labelsService.newLabelCategories$().subscribe(newLabelCategories => {
      if (newLabelCategories) {
        const group = {id: newLabelCategories["labels"][0]["_id"], content: newLabelCategories["labels"][0]["name"], category: newLabelCategories.name, categoryId: newLabelCategories.id};
        this.timelineData.addGroup(group);
        this.labelCategories.push(newLabelCategories);
      }
    }));

    this.subscription.add(this.labelsService.removedLabels$().subscribe(removed => {
      if (removed) {
        this.timelineData.removeGroup(removed.id);
      }
    }));

    this.subscription.add(this.labelsService.removedLabelCategories$().subscribe(removed => {
      if (removed) {
        let removedCategory: LabelCategoryModel = this.labelCategories.find((labelCategory) => { return labelCategory.id === removed.id;});
        this.timelineData.deleteGroupCategory(removedCategory.id);
        removedCategory.labels.map( label => this.timelineData.removeGroup(label["_id"]));
        this.labelCategories.filter(item => item !== removedCategory);
      }
    }));

    this.subscription.add(this.labelsService.editedLabels$().subscribe(changed => {
        if (changed) {
          this.timelineData.updateGroup({id: changed.id, content: changed.change});
        }
      })
    );

    this.subscription.add(this.labelsService.editedLabelCategories$().subscribe(changed => {
        if (changed) {
          this.timelineData.updateGroupCategory(changed.change, changed.id);
          let category: LabelCategoryModel = this.labelCategories.find( item => item.id === changed.id);
          category.name = changed.change;
          category.labels.map( label => label.name = changed.change + '_' + label.name.split('_')[1]);
          this.timeline.redraw();
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

  private checkForTracking(categoryId: string) {
    let category: LabelCategoryModel = this.labelCategories.find(value => value.id == categoryId );
    this.toolBoxService.triggerToolBox(category.isTrackable);
  }
}
