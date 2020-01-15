import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterEvent } from '@angular/router';
import { Subscription } from 'rxjs';
import { CurrentToolService } from '../../editor/project-toolbox.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: [ './layout.component.scss' ]
})
export class LayoutComponent implements OnInit, OnDestroy {

  isNavCollapsed = false;
  verticalNavVisible = false;
  verticalNavWidth = 13;
  toolStatus: boolean[];
  fillColor: string = '#044B94';

  private subscription: Subscription;
  private navSubscription: Subscription;
  iconStyle: string[];

  constructor(private router: Router,
              private toolService: CurrentToolService) {
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

    this.navSubscription = this.toolService.getCurrentToolBoxStatus$().subscribe( next => {
        this.isNavCollapsed = next;
      }
    );
    this.toolStatus = new Array(10).fill(false);
    this.iconStyle = new Array(10).fill('fit-content-width pointer');

    this.navSubscription.add(this.toolService.getCurrentColor$().subscribe(next => {
      if(next) {
        this.fillColor = next;
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getWidth() {
    return this.isNavCollapsed ? { width: 'min-content'} : { width: this.verticalNavWidth + 'rem' };
  }

  activateTool(index: number) {
    this.toolStatus = this.toolStatus.map(x => false);
    this.iconStyle = this.iconStyle.map(x => 'fit-content-width pointer');
    this.toolStatus[index] = true;
    this.iconStyle[index] = 'is-highlight fit-content-width pointer';
    this.toolService.updateSelectedTool(index);
    if(index == 3 || index == 6) {
      this.activateTool(1);
    }
  }

  changeColor(change) {
    this.toolService.updateSelectedColor(change);
    console.log(change);
  }
}
