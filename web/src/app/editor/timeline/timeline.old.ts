
// private project: ProjectModel;
// private recordingEvents = new EventEmitter<RecordingEvent>();
// import * as hyperid from './timeline.component';
// import { LinkedList } from 'typescript-collections';
// import { VgAPI } from 'videogular2/core';
// import { IdType, Timeline } from 'vis';
// import * as vis from 'vis';
// import { Subscription } from 'rxjs';
//
// private instance = hyperid();
// //
// private apis: LinkedList<VgAPI> = new LinkedList<VgAPI>();
//
// private timeline: Timeline;
// //
// // private classes: Classification[];
// private groups = new vis.DataSet();
// private items = new vis.DataSet();
// private options: TimelineOptions = {
//   groupOrder: 'content',  // groupOrder can be a property name or a sorting function,
//   width: '100%',
//   // height: '256px',
//   // margin: {
//   //   item: 20
//   // },
//   min: 0,
//   moment: function (date) {
//     return moment(date).utc();
//   },
//   // max: 1000,
//   editable: true,
//   zoomMin: 10000,
//   formatDatetime: {
//     minorLabels: {
//       millisecond: 'SSS',
//       second: 'mm:ss',
//       minute: 'HH:mm:ss',
//       hour: 'HH:mm:ss',
//       weekday: 'ddd D',
//       day: 'D',
//       week: 'w',
//       month: 'MMM',
//       year: 'YYYY'
//     },
//     majorLabels: {
//       millisecond: 'HH:mm:ss',
//       // second:     'D MMMM HH:mm',
//       second: '',
//       minute: 'ddd D MMMM',
//       hour: 'ddd D MMMM',
//       weekday: 'MMMM YYYY',
//       day: 'MMMM YYYY',
//       week: 'MMMM YYYY',
//       month: 'YYYY',
//       year: ''
//     }
//   }
// };
// private customTimeId: IdType;
// private subscription: Subscription;
// private loading = true;

//
// private registerHotkeys() {
//   for (let i = 0; i < 9; ++i) {
//     const hotkey = new Hotkey(`${i + 1}`, (event: KeyboardEvent): boolean => {
//       const clazz = this.classes[i];
//       if (clazz) {
//         this.toggleRecording(clazz);
//       }
//       return false;
//     }, undefined, `Toggle startRecording of the ${i + 1} label`);
//     this.hotkeyService.add(hotkey);
//   }
//
//   this.hotkeyService.add(new Hotkey('ctrl+s', (event: KeyboardEvent): boolean => {
//     console.log('save');
//     return false;
//   }, undefined, `Save the labels on the server`));
//
//   this.hotkeyService.add(new Hotkey('ctrl+e', (event: KeyboardEvent): boolean => {
//     console.log('export');
//     return false;
//   }, undefined, `Export the labels`));
// }
//
// private toggleRecording(cls: Classification) {
//   const prev = cls.buttonChecked;
//   cls.buttonChecked = !cls.buttonChecked;
//   /** if button's checked state switches from true to false, it means that the user wished to stop the startRecording*/
//   if (prev === true && cls.buttonChecked === false) {
//     cls.isLabellingFinished = true;
//     const range = cls.series[cls.series.length - 1];
//     this.recordingEvents.emit({eventType: RecordingEventType.Stop, labelId: cls.id, range: range});
//   }
// }
//

// setTimeout(() => this.timeline.focus(0), 1000);

//   this.subscription = this.labelService.getLabels$()
//     .pipe(pairwise(), throttleTime(50))
//     .subscribe((value) => {
//         // this.classes = value.labels.map(x => new Classification(x.name, [])); // fixme series
//         const prev = value[0].labels;
//         const curr = value[1].labels;
//
//         if (prev && curr) {
//           /** if the length of previous and current arrays is the same then:
//            * 1) this is the first observable value: no previous element exists
//            * 2) an element was edited
//            * */
//           if (prev.length === curr.length) {
//             curr.forEach(x => {
//               if (!this.groups.get(x.id)) {
//                 this.groups.add({id: x.id, content: x.name});
//               }
//             });
//
//             const edited = curr.filter(x => !prev.find(y => x.id === y.id && y.name === x.name));
//             edited.forEach(x => {
//               const group: DataGroup = this.groups.get(x.id);
//               if (group) {
//                 group.content = x.name;
//                 this.groups.update(group);
//               }
//             });
//           } else {
//             /** if the length of previous and current arrays is different, then an element was either added or removed */
//             const added = curr.filter(x => !prev.find(y => x.id === y.id));
//             const deleted = prev.filter(x => !curr.find(y => x.id === y.id));
//
//             added.forEach(x => {
//               const newGroup = {id: x.id, content: x.name};
//               this.groups.add(newGroup);
//             });
//             deleted.forEach(x => {
//               this.groups.remove(x.id);
//             });
//           }
//         }
//       }
//     );
//
//   this.subscription.add(this.editorService.getCurrentProject$()
//     .subscribe((project: ProjectModel) => {
//       if (project) {
//         this.project = project;
//         const labels = project.labels;
//         if (labels) {
//           labels.forEach((x) => {
//             this.groups.add({id: x.id, content: x.name});
//           });
//         }
//       }
//     }));
//
// this.subscription = this.videoService.playerReady.subscribe((api: VgAPI) => {
//   console.log('playerReady');
//   this.apis.add(api);
//   const sub: IMediaSubscriptions = api.subscriptions;
//   if (this.apis.size() === 1) {
// console.log('duration', api.duration);
// const timeUpdateSub = sub.timeUpdate.subscribe(() => {
// this.updateCurrentTime(api.currentTime);
//   this.classes.forEach((($class) => {
//     const series = $class.series;
//     const currentTime = api.currentTime;
//     const seriesCount = series.length;
//     const groupId = $class.id;
//     const authorId = this.authService.currentUserValue.id;
//
//     if ($class.buttonChecked) {
//       /** if the range list is empty or the labelling is finished we need to add a new range element*/
//       if (seriesCount === 0 || $class.isLabellingFinished) {
//         const rangeId = this.instance();
//         const range = new Range(rangeId, authorId, currentTime, currentTime);
//         series.push(range);
//         $class.isLabellingFinished = false;
//         this.addItemBox(rangeId, groupId, currentTime);
//         this.recordingEvents.emit({eventType: RecordingEventType.Start, labelId: groupId, range: range});
//       } else {
//         const lastRange: Range = series[seriesCount - 1];
//         lastRange.endTime = currentTime;
//         this.updateItem(lastRange.id, lastRange.endTime);
//         this.recordingEvents.emit({eventType: RecordingEventType.Recording, labelId: groupId, range: lastRange});
//       }
//     }
//   }));
// }));
//
// });

// const durationChangeSub = sub.durationChange.subscribe(() => { // todo setmax is only possible when the visualisation is loaded
//   console.log('durationChange', api.duration);
//   this.setMax(api.duration * 1000);
// });

// this.subscription.add(timeUpdateSub);
// this.subscription.add(durationChangeSub);
// }
// });
//
//   this.subscription.add(this.labelService.getLabels$().subscribe(value => {
//     this.classes = this.labelsToClasses(value.labels);
//     console.log('getLabels', this.classes);
//   }));
//
//   this.subscription.add(this.editorService.getCurrentProject$()
//     .subscribe(project => {
//       if (project) {
//         console.log(project);
// this.classes = this.labelsToClasses(value.labels);
// console.log('getCurrentProject', this.classes);
// this.classes.forEach(label => {
//   if (label.series) {
//     const ranges = label.series;
//     ranges.forEach(range => {
//       const count = this.items.length;
//       if (!this.items.get(range.id)) {
//         this.items.add({id: range.id, group: label.id, content: `Label ${count}`, start: range.startTime, end: range.endTime});
//       }
//     });
//   }
// });
// }
// }));
//
//   // create visualization
//   const container = document.getElementById('timeline');
//   this.timeline = new vis.Timeline(container, this.items, this.groups, this.options);
//   this.customTimeId = this.timeline.addCustomTime(0.0, 'currentPlayingTime');
//
//
//   this.subscription.add(this.recordingEvents.subscribe((event: RecordingEvent) => {
//     switch (event.eventType) {
//       case RecordingEventType.Start:
//         // console.log('startRecording started');
//         break;
//       case RecordingEventType.Stop:
//         console.log('startRecording stopped', JSON.stringify(event.range));
//         if (this.project) {
//           this.labelService.addRange(this.project.id, event.labelId, event.range);
//         }
//         break;
//       case RecordingEventType.Recording:
//         // console.log('startRecording ...');
//         break;
//       default:
//         break;
//     }
//   }));
//
//   this.items.on('remove', (event, properties, senderId) => {
//     console.log(event, properties);
//     if (event === 'remove') {
//       const id = properties.items[0];
//       const groupId = properties.oldData[0].group;
//       this.labelService.removeRange(this.project.id, groupId, id);
//     }
//   });
// }

//
// private labelsToClasses(labels: LabelModel[]) {
//   return labels.map(label => {
//     const ranges: Range[] = label.series
//       ? label.series.map(range => new Range(range.id, range.authorId, range.startTime, range.endTime))
//       : [];
//     return new Classification(label.id, label.name, label.authorId, ranges);
//   });
// }
//
// addItemBox(id: string, groupId: number | string, start: number | string) {
//   const count = this.items.length;
//   const item: DataItem = {id: id, group: groupId, content: `Label ${count}`, start: start, end: start};
//   this.items.add(item);
//   this.timeline.focus(id);
// }
//
// updateItem(id: string, endTime: number) {
//   const item: DataItem = this.items.get(id);
//   if (item) {
//     item.end = endTime;
//     this.items.update(item);
//   }
// }
//
// updateCurrentTime(seconds: number) {
//   const millis = seconds * 1000;
//   this.timeline.setCustomTime(millis, this.customTimeId);
//   const start = this.timeline.getWindow().start.getTime();
//   const end = this.timeline.getWindow().end.getTime();
//
//   const delta = 3 * (end - start) / 4; // center
//   console.log(millis, start + delta);
  // if (end < millis || millis < start) {
  //   this.timeline.moveTo(millis, {animation: false});
  // }
// if (millis > start + delta) {
//   this.timeline.moveTo(start + delta + 5000);
// }
//
// if (millis < start) {
//   this.timeline.moveTo(millis, {animation: false});
// }
//
// if (millis > end) {
//   this.timeline.moveTo(end, {animation: false});
// }
//
// if (seconds * 1000 > start + delta) {
//   this.timeline.moveTo(, {animation: false});
// }


// this.timeline.moveTo(seconds);
// }

//
// ngOnDestroy(): void {
//   this.timeline.destroy();
// }
//
// ngOnChanges(changes: SimpleChanges): void {
//
// }
//
// onCheckboxChange(clazz: Classification) {
//   this.toggleRecording(clazz);
// }
//
// private setMax(duration: DateType) {
//   const newOptions: TimelineOptions = Object.assign({}, this.options);
//   newOptions.max = duration;
//   this.timeline.setOptions(newOptions);
// }

// }
