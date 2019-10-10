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
  direction = 'horizontal';
  projectId: string;

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
    this.projectService.exportCsv(this.projectId)
      .toPromise()
      .then(
        value => {
          const blob = new Blob([value], {type: 'text/csv'});
          FileSaver.saveAs(blob, `labels-${this.projectId}-${moment().toISOString()}.csv`);
        },
        reason => {
          console.error('onExport', reason);
        }
      );
  }
}
