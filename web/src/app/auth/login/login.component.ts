import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { UserAuthModel } from '../../models/user.authorization.model';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClrLoadingState } from '@clr/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  @Input() appName: string;
  @Output() registerIntent = new EventEmitter();

  authModel = new UserAuthModel('', '', true);

  returnUrl: string;
  loading = false;
  error = false;

  errorMessage: string;

  loginBtnState: ClrLoadingState = ClrLoadingState.DEFAULT;

  private _subscription: Subscription;

  constructor(private authService: AuthService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/projects']);
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit() {
    // todo: add form validation

    this.loading = true;
    this.loginBtnState = ClrLoadingState.LOADING;
    this.error = false;

    this._subscription = this.authService.login(this.authModel.username, this.authModel.password)
      .subscribe(
        data => {

          if (data) {
            this.loading = false;
            this.loginBtnState = ClrLoadingState.SUCCESS;
            this.router.navigate([this.returnUrl]);
          } else {
            this.loading = false;
            this.loginBtnState = ClrLoadingState.ERROR;
            this.error = true;
          }
        }, error => {
          this.loading = false;
          this.error = true;
          this.loginBtnState = ClrLoadingState.ERROR;

          this.errorMessage = 'An unknown error occured';

          if (error === 'Forbidden') {
            this.errorMessage = 'Username and password combination is unknown';
          }
        });
  }

  ngOnDestroy(): void {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  onRegisterClick() {
    this.registerIntent.emit();
  }
}
