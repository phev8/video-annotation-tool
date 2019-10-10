import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelsService } from './labels.service';
import { LabelsSocket } from './labels.socket';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [ LabelsService, LabelsSocket ]
})
export class LabelsModule {
}
