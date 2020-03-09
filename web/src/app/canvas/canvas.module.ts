import { ElementRef, NgModule } from '@angular/core';
import { CanvasComponent } from './canvas.component';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRouting } from '../app.routing';
import {CanvasModalComponent} from "./canvas-modal/canvas-modal.component";


@NgModule({
  declarations: [ CanvasComponent, CanvasModalComponent ],
  imports: [
    CommonModule,
    AppRouting,
    FormsModule,
    ClarityModule,
    HttpClientModule,
  ],
  exports: [ CanvasComponent ]
})
export class CanvasModule {

}
