import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProjectsService } from '../projects/projects.service';
import { ProjectModel } from '../models/project.model';
import {UserModel} from "../models/user.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentProjectService {

  private colors: string[] = ['#97b0f8', '#E6E6FA', "#a262cc", '#6495ED', '#3CB371', '#87CEEB', , '#C0C0C0','#20B2AA', '#FA8072', '#DB7093', '#FAFAD2', '#9370DB', '#40E0D0', '#008080'];

  private currentProjectSubject: BehaviorSubject<ProjectModel>;
  private readonly currentProject$: Observable<ProjectModel>;

  constructor(private projectsService: ProjectsService) {
    this.currentProjectSubject = new BehaviorSubject(null);
    this.currentProject$ = this.currentProjectSubject.asObservable();
  }

  loadProject(id: string) {
    const currentProject = this.getCurrentProjectValue();
    if (!currentProject || (currentProject && currentProject.id !== id)) {
      this.projectsService.getProject(id)
        .toPromise()
        .then(value => {
          value = this.addColorsToUsers(value);
          this.currentProjectSubject.next(value);
        });
    }
  }

  getCurrentProject$(): Observable<ProjectModel> {
    return this.currentProject$;
  }



  getCurrentProjectValue(): ProjectModel {
    return this.currentProjectSubject.getValue();
  }

  reloadCurrentProject() {
    this.projectsService.getProject(this.getCurrentProjectValue().id)
      .toPromise()
      .then(value => this.currentProjectSubject.next(value));
  }

  exportCsv(projectId: string): Observable<any> {
    return this.projectsService.exportCsv(projectId);
  }

  findUserRole(project: ProjectModel, userId: string): string {
    if(project.ownerId.id === userId) return 'owner';
    let role = '';
    project.contributorIds.map(value => {
      if (value.id === userId) role =  'contributor';
    });
    project.supervisorIds.map(value => {
      if (value.id === userId) role = 'supervisor';
    });
    return  role;
  }

  getUsers(project: ProjectModel) {
    let response: UserModel[] = [];
    let i = 0;
    project.ownerId['color'] = this.colors[i];
    i++;
    response.push(project.ownerId);
    project.supervisorIds.forEach(member => {
      member['color'] = this.colors[i];
      i++;
      response.push(member);
      if(i >= this.colors.length) i=0;
    });
    project.contributorIds.forEach(member => {
      member['color'] = this.colors[i];
      i++;
      response.push(member);
      if(i >= this.colors.length) i=0;
    });
    return response;
  }

  private addColorsToUsers(value: ProjectModel) {
    value['color']
    return value;
  }

  predictRecommendation(project: ProjectModel) {
    this.projectsService.getRecommendations(project).subscribe(response => {
      return response;
    });
  }
}
