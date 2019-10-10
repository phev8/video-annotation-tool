import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ProjectModel } from '../../models/project.model';
import { ProjectsService } from '../projects.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-project-form',
  templateUrl: './project-modal.component.html',
  styleUrls: [ './project-modal.component.scss' ]
})
export class ProjectModalComponent implements OnInit, OnDestroy {
  model;

  modalOpen = false;
  private submitted = false;
  private subscription: Subscription;

  constructor(
    private projectsService: ProjectsService,
    private router: Router) {
  }

  ngOnInit() {
    this.model = new ProjectModel('', '', new Date());
  }

  onSubmit(form: FormGroup) {
    this.submitted = true;
    this.modalOpen = false;

    this.subscription = this.projectsService.insertProject(this.model)
      .subscribe(response => {
        if (response.result.ok === 1) {
          this.projectsService.reload();
          this.router.navigate([ `/editor/${response.id}` ]);
        } else {
          // todo: show error
          console.error(JSON.stringify(response));
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
