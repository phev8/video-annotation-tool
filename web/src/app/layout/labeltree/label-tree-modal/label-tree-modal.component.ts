import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import _ from "lodash";
import { Subscription } from 'rxjs';
import { LabelCategoryModel } from '../../../models/labelcategory.model';
import { LabelMetadataModel } from '../../../models/labeltracking.model';
import { LabelsService } from '../../../labels/labels.service';


@Component({
  selector: 'app-label-form',
  templateUrl: './label-tree-modal.component.html',
  styleUrls: [ './label-tree-modal.component.scss' ]
})
export class LabelTreeModalComponent implements OnInit, OnDestroy {
  @Input() userRole:string;
  @Input() singleMediaProject: boolean;

  @Output() onHide = new EventEmitter<boolean>();
  model;

  modalOpen:boolean = false;
  private submitted = false;
  private subscription: Subscription;

  constructor(
    private labelsService: LabelsService,
    private router: Router) {
  }

  ngOnInit() {
    this.model = new LabelMetadataModel('', false, '');
    this.modalOpen = true;
    this.model.samplingUnit = 'ms';
  }

  onSubmit(form: FormGroup) {
    this.labelsService.addNewLabelCategory(JSON.parse(localStorage.getItem('currentSession$'))['user']['id'], this.userRole, this.model);
    this.modalOpen = false;
    this.model.singleMedia = form.value.options;
    this.onHide.emit(true);
  }

  ngOnDestroy(): void {
    this.onHide.emit(true);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  cancel() {
    this.onHide.emit(true);
    this.modalOpen = false;
  }

  toggleModalStatus() {
    if(this.modalOpen) {
      this.modalOpen = !this.modalOpen;
      this.onHide.emit(true);
    }
  }
}
