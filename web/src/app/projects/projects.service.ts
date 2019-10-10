import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError} from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { ProjectModel } from '../models/project.model';
import { AuthService } from '../auth/auth.service';
import { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.projectsSubject = new BehaviorSubject<ProjectModel[]>([]);
    this.currentProjects$ = this.projectsSubject.asObservable();
    this.getProjects().toPromise().then((value => {
      this.projectsSubject.next(value);
    }));
  }

  projectsUrl = `${environment.apiUrl}/project`;

  private projectsSubject: BehaviorSubject<ProjectModel[]>;
  currentProjects$: Observable<ProjectModel[]>;

  getProjects(): Observable<ProjectModel[]> {
    const userId = this.authService.currentUserValue.id;
    return this.http.get<ProjectModel[]>(`${this.projectsUrl}/all/${userId}`)
      .pipe(
        catchError(this.handleError('getProjects', []))
      );
  }

  getProject(id: string): Observable<ProjectModel> {
    const url = `${this.projectsUrl}/${id}`;
    return this.http.get<ProjectModel>(url)
      .pipe(catchError(this.handleError<ProjectModel>(`getProject id=${id}`)));
  }

  insertProject(project: ProjectModel): Observable<any> {
    return this.http.post<ProjectModel>(`${this.projectsUrl}/`, project)
      .pipe(catchError(this.handleError<any>(`insertProject ${JSON.stringify(project)}`)));
  }

  updateProjectMembers(project: ProjectModel): Observable<any> {
    return this.http.put<void>(`${this.projectsUrl}/${project.id}/members`, project)
      .pipe(catchError(this.handleError<any>(`insertProject ${JSON.stringify(project)}`)));
  }

  deleteProject(name: string): Observable<Object> {
    return this.http.delete(`${this.projectsUrl}/` + name);
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T): (error: any) => Observable<T> {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      // this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  reload() {
    this.getProjects().toPromise().then((value => {
      this.projectsSubject.next(value);
    }));
  }

  deleteFile(id: string, filename: string): Observable<Object> {
    const url = `${this.projectsUrl}/files/${id}/${filename}`;
    return this.http.delete(url);
  }

  exportCsv(projectId: string): Observable<any> {
    return this.http.get(`${this.projectsUrl}/${projectId}/segments/csv`, {responseType: 'text'});
  }

  getMembers(selectedProject: ProjectModel): Observable<any> {
    const ids = selectedProject.memberIds.toString();
    return this.authService.fetchUsers(ids);
  }
}
