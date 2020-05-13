import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError} from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {

  constructor(
    private authService: AuthService,
    private http: HttpClient) {
  }

  tutorialUrl = `${environment.apiUrl}/tutorial`;

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
  }
}
