import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentProjectService } from './current-project.service';
import { LabelsService } from '../labels/labels.service';
import * as FileSaver from 'file-saver';
import * as moment from 'moment';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {
  direction = 'vertical';
  projectId: string;
  private inExportProgress: boolean;

  constructor(private route: ActivatedRoute,
              private projectService: CurrentProjectService,
              private labelService: LabelsService) {
  }

  ngOnInit() {
    /** Get project id from the current route */
    this.projectId = this.route.snapshot.paramMap.get('id');
    this.projectService.loadProject(this.projectId);
    this.labelService.joinProject(this.projectId);
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
          const blob = new Blob([value], {type: 'text/csv'});
          FileSaver.saveAs(blob, `labels-${this.projectId}-${moment().toISOString()}.csv`);
        },
        reason => {
          this.inExportProgress = false;
          alert('Failed to export: '+ reason);
          console.error('onExport', reason);
        }
      );
  }
}
