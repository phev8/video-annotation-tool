import {Component, OnDestroy, OnInit} from '@angular/core';
import {IDirectory} from '../../interfaces/IDirectory';
import {LabelsService} from '../../labels/labels.service';
import {CurrentProjectService} from '../../editor/current-project.service';
import {Subscription} from 'rxjs';
import {ProjectModel} from '../../models/project.model';
import {IFile} from '../../interfaces/IFile';

@Component({
  selector: 'app-label-tree',
  templateUrl: './label-tree.component.html',
  styleUrls: ['./label-tree.component.scss']
})
export class LabelTreeComponent implements OnInit, OnDestroy {

  annotationsFolder: IDirectory = {
    name: 'Dictionary',
    icon: 'folder',
    expanded: true,
    files: []
  };

  private project: ProjectModel;
  labelTreeModal: boolean;
  private userRole: string;
  private subscription: Subscription;

  constructor(private projectService: CurrentProjectService, private labelsService: LabelsService) {
  }

  ngOnInit() {
    this.labelTreeModal = false;
    this.subscription = this.projectService.getCurrentProject$()
      .subscribe(project => {
        if (project) {
          this.project = project;
          this.userRole = this.projectService.findUserRole(project, JSON.parse(localStorage.getItem('currentSession$'))['user']['id']);
          this.labelsService.getLabelCategories().then(value =>
            this.annotationsFolder.files = value.map(label => ({id: label.id, name: label.name, icon: 'tag', active: false}))
          );
        }
      });

    //TODO: Remove this section
    this.subscription.add(this.labelsService.newLabels$().subscribe(label => {
      /*if (label) {
        this.annotationsFolder.files.push({id: label.id, name: label.name, icon: 'tag', active: false});
      }*/
    }));

    this.subscription.add(this.labelsService.newLabelCategories$().subscribe(labelCategory => {
      if (labelCategory) {
        this.annotationsFolder.files.push({id: labelCategory.id, name: labelCategory.name, icon: 'tag', active: false});
      }
    }));

    this.subscription.add(this.labelsService.removedLabels$().subscribe(e => {
      const len = this.annotationsFolder.files.length;
      const i = this.annotationsFolder.files.findIndex(x => x.id === e.id);
      if (0 <= i && i < len) {
        this.annotationsFolder.files.splice(i, 1);
      }
    }));

    this.subscription.add(this.labelsService.removedLabelCategories$().subscribe(e => {
      const len = this.annotationsFolder.files.length;
      const i = this.annotationsFolder.files.findIndex(x => x.id === e.id);
      if (0 <= i && i < len) {
        this.annotationsFolder.files.splice(i, 1);
      }
    }));

    this.subscription.add(this.labelsService.editedLabelCategories$(true).subscribe(edit => {
      if (edit) {
        const labelId = edit.id;
        const changeName = edit.change;
        const i = this.annotationsFolder.files.findIndex(x => x.id === labelId);
        const length = this.annotationsFolder.files.length;
        if (0 <= i && i < length) {
          this.annotationsFolder.files[i].name = changeName;
        }
      }
    }));

    this.subscription.add(this.labelsService.systemRecommendations$().subscribe( response => {
      if(confirm('New system generated annotations for the current project are ready!')) {
      }
      location.reload();
    }));
  }

  addNewLabel() {
    this.labelsService.addLabel(JSON.parse(localStorage.getItem('currentSession$'))['user']['id'],'', '');
  }

  addNewLabelCategory() {
    this.labelTreeModal = true;
    //TODO Remove this section
    //this.labelsService.addLabel('');
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onLabelDelete(id: string) {
    this.labelsService.deleteLabel(id);
  }

  onLabelCategoryDelete(id: string) {
    if (confirm('Are you sure you want to delete selected category?'))
      this.labelsService.deleteLabelCategory(id);
  }

  onLabelNameChange(label: IFile) {
    this.labelsService.editLabel(label.id, label.name);
  }

  onLabelCategoryNameChange(label: IFile) {
    this.labelsService.editLabelCategory(label.id, label.name);
  }

  changeHide($event) {
    this.labelTreeModal = false;
  }
}
