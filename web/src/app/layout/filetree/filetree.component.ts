import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CurrentProjectService } from '../../editor/current-project.service';
import { ProjectModel } from '../../models/project.model';
import { Subscription } from 'rxjs';
import { DirectoryModel } from '../../models/directory.model';

import { IFile } from '../../interfaces/IFile';
import { IDirectory } from '../../interfaces/IDirectory';
import { FileModel } from '../../models/file.model';
import { FileUploadComponent } from '../../upload/file-upload/file-upload.component';
import {IRecommendStatus} from "../../interfaces/iRecommendStatus";

@Component({
  selector: 'app-filetree',
  templateUrl: './filetree.component.html',
  styleUrls: [ './filetree.component.scss' ]
})
export class FiletreeComponent implements OnInit, OnDestroy {

  project: ProjectModel;
  private subscription: Subscription;

  rootDirectory: IDirectory[] = [];
  fileIndex = new Map<string, FileModel>();

  @ViewChild(FileUploadComponent) uploadDialog: FileUploadComponent;

  loading = true;

  constructor(private editorService: CurrentProjectService) {
  }

  ngOnInit() {
    this.subscription = this.editorService.getCurrentProject$()
      .subscribe(project => {
        if (project) {
          this.loading = false;
          this.project = project;

          if (project.fileTree) {
            this.rootDirectory = this.buildFileTree(this.project.fileTree);
          }
        }
      });
  }


  buildFileTree(fileTree: DirectoryModel): IDirectory[] {
    const filesFolder = {
      name: 'Files',
      icon: 'folder',
      expanded: true,
      files: []
    };

    /** fixme: for now support only 1-level of nesting */
    if (fileTree && fileTree.children) {
      fileTree.children.forEach(model => {
        const file: IFile = {
          name: model.name,
          filename: model.filename,
          icon: model.mimetype.startsWith('video') ? 'film-strip' : 'file',
          active: false
        };

        filesFolder.files.push(file);
        this.fileIndex.set(file.name, model);
      });
    }

    return [ filesFolder ];
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  openFile(file: IFile) {
    file.active = !file.active;
  }

  openUploadDialog() {
    this.uploadDialog.openDialog();
  }

  predict() {
    if (this.project.singleMedia) {
       this.editorService.predictRecommendation(this.project).subscribe( response => {
         const statusResponse: IRecommendStatus = {status: response.status, message: response.message, pollId: response.pollId};
         console.log(statusResponse);
         if (statusResponse.status === 1) {
           alert(response.message + '\nKindly wait for the recommendations to complete.');
         } else if (statusResponse.status === 0) {
           alert(response.message + '\nKindly retry after some time or contact support for help.');
         } else {
           alert(response.message + '\nRecommendations have been generated.');
           if (confirm('Regenerate Recommendations ?')) {
             this.editorService.repredictRecommendations(this.project.id).subscribe( response => {
               alert(response.message);
             });
           }
         }
       });
    }
  }
}
