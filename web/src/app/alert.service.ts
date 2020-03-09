import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alerts: BehaviorSubject<any>;
  private readonly alertStatus$: Observable<any>;

  constructor() {
    this.alerts = new BehaviorSubject({});
    this.alertStatus$ = this.alerts.asObservable();
  }

  createNewAlert(change: any) {
    this.alerts.next(change);
  }

  getCurrentAlert$():  Observable<any> {
    return this.alertStatus$;
  }
}
