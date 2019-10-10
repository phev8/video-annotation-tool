import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { SessionModel } from '../models/session.model';
import { UserModel } from '../models/user.model';
import { UserSignupModel } from '../models/user.registration.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {
    this.currentSessionSubject = new BehaviorSubject<SessionModel>(JSON.parse(localStorage.getItem('currentSession$')));
    this.currentSession$ = this.currentSessionSubject.asObservable();
  }

  public get currentSessionValue(): SessionModel {
    return this.currentSessionSubject.value;
  }

  public get currentUserValue(): UserModel {
    if (this.currentSessionSubject.value) {
      return this.currentSessionSubject.value.user;
    }
  }

  private authUrl = `${environment.apiUrl}/auth`;
  private userUrl = `${environment.apiUrl}/users`;

  private currentSessionSubject: BehaviorSubject<SessionModel>;
  public currentSession$: Observable<SessionModel>;


  private static handleRegistrationError(error: HttpErrorResponse) {
    let message = 'Something bad happened; please try again later.';

    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      message = error.error.message;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      switch (error.status) {
        case 400:
          message = 'Please try to reloadCurrentProject the page';
          break;
        case 500:
          message = 'The server is unable to fulfill the request. Please contact your system administrator';
          break;
        case 409:
          message = 'A user with such details already exists';
          break;
        default:
          message = 'Something bad happened; please try again later.';
          break;
      }
    }
    // return an observable with a user-facing error message
    return throwError(message);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<SessionModel>(this.authUrl, {username, password})
      .pipe(map(session => {
          if (session && session.user && session.accessToken) {
            localStorage.setItem('currentSession$', JSON.stringify(session));
            this.currentSessionSubject.next(session);
          }
          return session;
        })
      );
  }

  logout() {
    localStorage.removeItem('currentSession$');
    this.currentSessionSubject.next(null);
  }

  isLoggedIn() {
    return this.currentSessionSubject.getValue();
  }

  register(signupModel: UserSignupModel): Observable<HttpResponse<any>> {
    return this.http.post<any>(this.userUrl,
      {
        username: signupModel.username,
        email: signupModel.email,
        password: signupModel.password
      })
      .pipe(catchError(AuthService.handleRegistrationError));
  }

  fetchUsers(id: string): Observable<UserModel[]> {
    const headers = new HttpHeaders({'ids': id});
    const url = `${this.userUrl}`;
    return this.http.get<UserModel[]>(url, {headers: headers})
      .pipe(catchError(this.handleError<UserModel[]>(`fetch users for ids: ${id}`)));
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

}
