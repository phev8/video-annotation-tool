import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { HttpClientModule } from '@angular/common/http';

import { AppRouting } from '../app.routing';

import { TutorialComponent } from './tutorial.component';


@NgModule({
  declarations: [
    TutorialComponent,
  ],
  imports: [
    CommonModule,
    AppRouting,
    FormsModule,
    ClarityModule,
    HttpClientModule,
  ]
})
export class TutorialModule {
}
