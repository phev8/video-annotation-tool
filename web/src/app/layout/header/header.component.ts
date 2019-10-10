import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterEvent} from '@angular/router';
import {AuthService} from '../../auth/auth.service';
import {SessionModel} from '../../models/session.model';
import {UserModel} from '../../models/user.model';
import {Subscription} from 'rxjs';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styles: [],
  animations: [
    trigger('openClose',
      [
        state('open',
          style({
            height: '2.5rem'
          })
        ),
        state('closed',
          style({
            height: '0rem'
          })),
        transition('open => closed',
          [animate('0.2s')]),
        transition('closed => open',
          [animate('0.2s')])
      ],
    )
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isProjectActive = true;
  isEditorActive = false;
  isHeaderVisible = true;

  private user: UserModel;
  private subscription: Subscription;
  editorLink = '/';


  constructor(private router: Router,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.subscription = this.router.events.subscribe((event: RouterEvent) => {
      const url: string = event.url;
      if (url) {
        if (url.startsWith('/project')) {
          this.isProjectActive = true;
          this.isEditorActive = false;
        } else if (url.startsWith('/editor')) {
          this.isProjectActive = false;
          this.isEditorActive = true;
          this.editorLink = url;
        }
      }
    });

    this.subscription.add(
      this.authService.currentSession$.subscribe((x: SessionModel) => {
        if (x && x.user) {
          this.user = x.user;
        }
        this.isHeaderVisible = !x;
      }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
    this.editorLink = '/';
  }

  onHide() {
    // todo: improve appearance
    this.isHeaderVisible = !this.isHeaderVisible;
  }

  get username() {
    if (this.user) {
      return this.user.username;
    }
    return '';
  }
}
