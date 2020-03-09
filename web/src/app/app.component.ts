import {Component, ViewChild} from '@angular/core';
import { ClrAlerts } from '@clr/angular';
import {AlertService} from "./alert.service";

export interface AppLevelAlert {
  type: 'info' | 'warning' | 'success' | 'danger';
  text: string;
  action: string;
  shape: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: [ 'app.component.scss' ],
})
export class AppComponent {
  @ViewChild(ClrAlerts) alertsContainer: ClrAlerts;
  private interval;
  alerts: AppLevelAlert[] = [];
  close: boolean = false;

  constructor(
    private alertService: AlertService) {

  }

  ngAfterViewInit(): void {
    this.alert();
    this.alertService.getCurrentAlert$().subscribe(next => {
      if(next.type) {
        this.close = false;
        this.create_alert(next.type, next.text, next.action);
        setTimeout(() => {
          this.close = true;
        }, 5000);
      }
    })
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  private alert() {
    if (!this.alertsContainer.currentAlert) {
      this.alertsContainer.multiAlertService.current = 0;
    }
  }

  private create_alert(type, text, action) {
    this.alerts = [];
    const shape = type == 'info'? 'info-circle' : type == 'warning' ? 'exclamation-triangle' : type == 'success' ? 'check-circle' : 'exclamation-circle';
    this.alerts.push({
      type: type,
      text: text,
      action: action,
      shape: shape
    });
    if (!this.alertsContainer.currentAlert) {
      this.alertsContainer.multiAlertService.current = 0;
    }
  }

  title = 'app';
}
