import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProjectsService } from '../projects/projects.service';
import { ProjectModel } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class CurrentProjectService {

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
        .then(value => this.currentProjectSubject.next(value));
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
}
