import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideogridComponent } from './videogrid/videogrid.component';
import { VideoComponent } from './video/video.component';
import { MatGridListModule } from '@angular/material';
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { VideoService } from './video.service';
import { HotkeyModule } from 'angular2-hotkeys';
import { CanvasModule } from '../canvas/canvas.module';


@NgModule({
  declarations: [ VideoComponent, VideogridComponent ],
  imports: [
    CommonModule,
    FormsModule,
    ClarityModule,
    MatGridListModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    HotkeyModule,
    CanvasModule
  ],
  exports: [ VideogridComponent ],
  providers: [ VideoService]
})
export class VideoModule {
}
