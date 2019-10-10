import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { HttpClientModule } from '@angular/common/http';

import { AppRouting } from '../app.routing';

import { ProjectsComponent } from './projects.component';
import { ProjectModalComponent } from './project-modal/project-modal.component';


@NgModule({
  declarations: [
    ProjectsComponent,
    ProjectModalComponent,
  ],
  imports: [
    CommonModule,
    AppRouting,
    FormsModule,
    ClarityModule,
    HttpClientModule,
  ]
})
export class ProjectsModule {
}
