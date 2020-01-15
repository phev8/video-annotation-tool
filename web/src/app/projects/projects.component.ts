import { Component, OnInit } from '@angular/core';
import { ProjectsService } from './projects.service';
import { ProjectModel } from '../models/project.model';
import { UserModel } from '../models/user.model';
import { AuthService } from '../auth/auth.service';
import { CurrentToolService } from '../editor/project-toolbox.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: [ 'projects.component.scss' ],
})
export class ProjectsComponent implements OnInit {
  projects: ProjectModel[] = [];
  inviteMembers = false;
  isDatagridView = false;
  members: UserModel[] = [];
  selectedProject: ProjectModel;
  invitedUser = '';
  error = false;

  constructor(private projectsService: ProjectsService,
              private authService: AuthService,
              private toolBoxService: CurrentToolService) {
  }

  ngOnInit() {
    this.projectsService.currentProjects$
      .subscribe(projects => {
          this.projects = projects;
        }
      );

    this.toolBoxService.triggerToolBox(false);
    this.toolBoxService.triggerCanvas(null);
  }

  refresh() {
    this.projectsService.reload();
  }

  onInvite(projectId: string) {
    this.selectedProject = this.projects.find(function(project){
      return project.id === projectId;
    });
    this.projectsService.getMembers(this.selectedProject).subscribe( members => {
      this.members = members;
      this.inviteMembers = true;
    });
  }

  onDelete(id: string) {
    if(confirm("Are you sure you want to delete the selected project?"))
      this.projectsService.deleteProject(id)
        .subscribe(temp => {
          this.projectsService.reload();
          }
        );
  }

  invite() {
    if(!this.members.some( element => element.id === this.invitedUser)) {
      this.authService.fetchUsers(this.invitedUser).subscribe(members => {
        this.members.push(members[0]);
      });
    }
  }

  changeMembers(member: UserModel) {
    this.members = this.members.filter(function(value, index, arr){
      return value !== member;
    });
  }

  updateMembers() {
    let ids: string[] = [];
    this.members.forEach(value => { ids.push(value.id)});
    this.selectedProject.memberIds = ids;
    this.projectsService.updateProjectMembers(this.selectedProject)
      .subscribe(response => {
          this.inviteMembers = false;
          this.projectsService.reload();
      });
  }

  closeInvitation() {
    this.members = [];
    this.inviteMembers = false;
  }
}
