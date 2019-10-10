import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UploadService } from '../upload.service';
import { forkJoin, Observable } from 'rxjs';
import { ProjectModel } from '../../models/project.model';
import { CurrentProjectService } from '../../editor/current-project.service';

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
              private uploadService: UploadService) {
  }

  ngOnInit() {
  }

  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    const files: { [key: string]: File } = this.file.nativeElement.files;
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

  closeDialog() {
    if (this.uploadSuccessful) {
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
    this.reset();
    this.closeModal();
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
}
