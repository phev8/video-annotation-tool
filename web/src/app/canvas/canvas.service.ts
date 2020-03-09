import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable, of, timer} from 'rxjs';
import { TrackerModel } from '../models/tracker.model';
import {catchError, concatMap, filter, map, take} from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import {AlertService} from "../alert.service";
import { merge } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  private trackerUrl = `${environment.apiUrl}/tracker`;
  private updatedTracker: BehaviorSubject<string>;
  private readonly updatedTrackerLabelId$: Observable<string>;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private alertService: AlertService) {
    this.updatedTracker = new BehaviorSubject("");
    this.updatedTrackerLabelId$ = this.updatedTracker.asObservable();
  }

  getTrackingInformation(id: string): Observable<TrackerModel> {
    const url = `${this.trackerUrl}/${id}`;
    return this.http.get<TrackerModel>(url)
      .pipe(catchError(this.handleError<TrackerModel>(`getTrackers trackerId=${id}`)));
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

  updateTrackerModel(model: TrackerModel, videoDimensions: string, filename: string) {
    model['videoDimensions'] = videoDimensions;
    model['filename'] = filename;
    const url = `${this.trackerUrl}/update/${model.id}`;
    return this.http.put(url, model);
  }

  getUpdatedTrackerLabelId$(): Observable<string> {
    return this.updatedTrackerLabelId$;
  }

  startPolling(pollingId: string) {
    const url = `${this.trackerUrl}/polling/${pollingId}`;
    /*
    const getRequest = this.http.get(url);
    return this.http.get()*/
    return timer(0, 1000)
      .pipe(concatMap(() => from(this.http.get(url))
        .pipe(map(response => response)))
      )
      .pipe(filter(backendData => (backendData["completed"] === true)))
      .pipe(take(1));
  }

  updateTracker(labelId: string) {
    this.updatedTracker.next(labelId);
  }
}
