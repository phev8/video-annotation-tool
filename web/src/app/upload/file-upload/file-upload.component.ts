import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UploadService } from '../upload.service';
import { forkJoin, Observable } from 'rxjs';
import { ProjectModel } from '../../models/project.model';
import { CurrentProjectService } from '../../editor/current-project.service';
import { ProjectsService } from '../../projects/projects.service';
import { nextContext } from '@angular/core/src/render3';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: [ './file-upload.component.scss' ]
})
export class FileUploadComponent implements OnInit {
  @Input() currentProject: ProjectModel;

  @ViewChild('file') file;
  public files: Set<File> = new Set();
  opened: boolean;
  progress: Map<string, Observable<number>>;
  canBeClosed = true;
  primaryButtonText = 'Upload';
  showCancelButton = true;
  uploading = false;
  uploadSuccessful = false;
  rawFiles: any;

  constructor(private editorService: CurrentProjectService,
              private uploadService: UploadService,
              private projectService: ProjectsService,
              private elementRef: ElementRef) {
  }

  ngOnInit() {
  }

  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    const files: { [key: string]: File } = this.currentProject.singleMedia? Array.prototype.slice.call( this.file.nativeElement.files, 0, 1 ) : this.file.nativeElement.files;
    for (const key in files) {
      if (!isNaN(parseInt(key, 10))) {
        this.files.add(files[key]);
      }
    }
  }

  openDialog() {
    this.openModal();
  }

  private openModal() {
    this.opened = true;
  }

  updateProjectDimensions(uploadComplete: boolean) {
    if(this.currentProject.singleMedia) {
      let drawingBoardElement = this.elementRef.nativeElement.offsetParent.getElementsByTagName("drawing-board")[0];
      if(drawingBoardElement) {
        this.currentProject.videoDimensions = ""+ drawingBoardElement.offsetHeight+ " " + drawingBoardElement.offsetWidth;
        this.projectService.updateProject(this.currentProject).subscribe(next => {
          if(uploadComplete)
            this.fetchRecommendations();
        });
      }
    }
  }

  closeDialog() {
    if (this.uploadSuccessful) {
      if(this.currentProject.singleMedia) {
        this.updateProjectDimensions(true);
      }
      this.reset();
      this.closeModal();
      return;
    }

    this.uploading = true;
    this.progress = this.uploadService.uploadToProject(this.currentProject.id, this.files);

    const allProgressObservables = [];
    for (const key in this.progress) {
      if (this.progress.hasOwnProperty(key)) {
        allProgressObservables.push(this.progress[key].progress);
      }
    }

    this.primaryButtonText = 'Finish';
    this.canBeClosed = false;
    this.showCancelButton = false;

    forkJoin(allProgressObservables).subscribe(() => {
      this.canBeClosed = true;
      this.showCancelButton = false;

      this.uploadSuccessful = true;
      this.uploading = false;

      this.editorService.reloadCurrentProject();
    });
  }

  onCancel() {
    this.updateProjectDimensions(false);
    this.reset();
    this.closeModal();
  }

  private fetchRecommendations() {
    if (this.currentProject.singleMedia) {
      this.editorService.predictRecommendation(this.currentProject);
    }
  }

  private closeModal() {
    this.opened = false;
  }

  private reset() {
    this.files.clear();
    this.rawFiles = null;
    this.progress = null; // fixme: memory leak?
    this.uploadSuccessful = false;
  }

  openChange(value: boolean) {
    if (value) {
      this.openDialog();
    } else {
      this.onCancel();
    }
  }
}
