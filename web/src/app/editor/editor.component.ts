import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentProjectService } from './current-project.service';
import { LabelsService } from '../labels/labels.service';
import * as FileSaver from 'file-saver';
import * as moment from 'moment';
import {AlertService} from "../alert.service";
import {UserModel} from "../models/user.model";

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  direction = 'vertical';
  projectId: string;
  inExportProgress: boolean;
  users: UserModel[] = [];

  constructor(private route: ActivatedRoute,
              private projectService: CurrentProjectService,
              private labelService: LabelsService,
              private alertService: AlertService) {
  }

  ngOnInit() {
    /** Get project id from the current route */
    this.projectId = this.route.snapshot.paramMap.get('id');
    this.projectService.loadProject(this.projectId);
    this.labelService.joinProject(this.projectId);

    this.projectService.getCurrentProject$().subscribe(project => {
      if(project) {
        this.users = this.projectService.getUsers(project);
      }
    });
  }


  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.labelService.leaveProject(this.projectId);
  }

  onExport() {
    this.inExportProgress = true;
    this.projectService.exportCsv(this.projectId)
      .toPromise()
      .then(
        value => {
          this.inExportProgress = false;
          const blob = new Blob([value], {type: 'text/json'});
          FileSaver.saveAs(blob, `labels-${this.projectId}-${moment().toISOString()}.json`);
        },
        reason => {
          this.inExportProgress = false;
          this.alertService.createNewAlert({
            type: 'danger',
            text: 'Failed to export: '+ reason,
            action: ''
          });
          //alert('Failed to export: '+ reason);
          console.error('onExport', reason);
        }
      );
  }
}
