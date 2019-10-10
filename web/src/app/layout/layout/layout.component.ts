import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterEvent } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: [ './layout.component.scss' ]
})
export class LayoutComponent implements OnInit, OnDestroy {

  isNavCollapsed = false;
  verticalNavVisible = false;
  verticalNavWidth = 13;

  private subscription: Subscription;

  constructor(private router: Router) {
  }

  ngOnInit() {
    this.subscription = this.router.events.subscribe(
      (e: RouterEvent) => {
        const url = e.url;
        if (url) {
          this.verticalNavVisible = url.startsWith('/editor');
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getWidth() {
    return this.isNavCollapsed ? {} : { width: this.verticalNavWidth + 'rem' };
  }
}
