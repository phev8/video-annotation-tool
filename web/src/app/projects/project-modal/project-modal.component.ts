import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import _ from "lodash";
import { ProjectModel } from '../../models/project.model';
import { ProjectsService } from '../projects.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserModel } from '../../models/user.model';
import { MemberModel } from '../../models/member.model';


@Component({
  selector: 'app-project-form',
  templateUrl: './project-modal.component.html',
  styleUrls: [ './project-modal.component.scss' ]
})
export class ProjectModalComponent implements OnInit, OnDestroy {

  @Input()
  freshStart: boolean;

  model;
  supervisorModel: MemberModel;
  contributorModel: MemberModel;
  singleMedia: boolean;

  modalOpen = false;
  private submitted = false;
  private subscription: Subscription;

  constructor(
    private projectsService: ProjectsService,
    private router: Router,
    private authService: AuthService) {
  }

  ngOnInit() {
    this.model = new ProjectModel('', '', new Date(), true, [], []);
    this.supervisorModel = new MemberModel('', false, [], true, true, 'supervisor');
    this.contributorModel = new MemberModel('', false, [], true, true, 'contributor');
    this.singleMedia = true;
  }

  onSubmit(form: FormGroup) {
    this.submitted = true;
    this.modalOpen = false;
    this.model.singleMedia = form.value.options;

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

  onSupervisorChange(temp) {
    this.handleUserQuery(this.supervisorModel);
  }

  handleUserQuery(model: MemberModel) {
    if(model.name === '') {
      model.members = [];
      model.searchStatus = true;
      model.emptyMemberStatus = true;
    } else {
      this.authService.getUsersByUsername(model.name).subscribe( members => {
        model.members = members;
        model.searchStatus = false;
        model.emptyMemberStatus = !(members.length === 0);
      });
    }
  }


  onContributorChange(temp) {
    this.handleUserQuery(this.contributorModel);
  }

  selectUser(user: UserModel, memberModel: MemberModel) {
    if(memberModel.type === 'supervisor') {
      if(!_.find(this.model.supervisorIds, { id : user.id}))
        this.model.supervisorIds.push(user);
    } else {
      if(!_.find(this.model.contributorIds, { id : user.id}))
        this.model.contributorIds.push(user);
    }
    memberModel.name = '';
    memberModel.searchStatus = true;
    memberModel.emptyMemberStatus = true;
  }

  deselectUser(user: UserModel, memberModel: MemberModel) {
    if(memberModel.type === 'supervisor') {
      this.model.supervisorIds = this.model.supervisorIds.filter(function(e) { return e !== user });
    } else {
      this.model.contributorIds = this.model.contributorIds.filter(function(e) { return e !== user });
    }
  }
}
