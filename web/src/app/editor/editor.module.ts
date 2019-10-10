import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { AngularSplitModule } from 'angular-split';

import { AppRouting } from '../app.routing';
import { EditorComponent } from './editor.component';
import { UploadModule } from '../upload/upload.module';
import { TimelineComponent } from './timeline/timeline.component';
import { VideoModule } from '../video/video.module';
import { HotkeyModule } from 'angular2-hotkeys';

@NgModule({
  declarations: [ EditorComponent, TimelineComponent ],
  imports: [
    CommonModule,
    FormsModule,
    AppRouting,
    ClarityModule,
    UploadModule,
    VideoModule,
    AngularSplitModule.forRoot(),
    HotkeyModule
  ]
})
export class EditorModule {
}
