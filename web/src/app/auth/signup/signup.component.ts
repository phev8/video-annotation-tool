import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserSignupModel } from '../../models/user.registration.model';
import { ClrLoadingState } from '@clr/angular';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: [ './signup.component.scss' ]
})
export class SignupComponent implements OnInit {
  @Input() appName: string;
  @Output() onLoginIntent = new EventEmitter();

  model = new UserSignupModel('', '', '', '');

  loading = false;
  error = false;
  arePasswordsSame = false;
  message = '';
  errorMessage = '';

  signupBtnState: ClrLoadingState = ClrLoadingState.DEFAULT;
  complete = false;

  constructor(private authService: AuthService,
              private router: Router) {
  }

  ngOnInit() {
  }

  onSubmit() {
    this.loading = true;
    this.signupBtnState = ClrLoadingState.LOADING;
    this.error = false;

    this.authService.register(this.model)
      .subscribe(
        (data: HttpResponse<any>) => {
          if (data) {
            this.loading = false;
            this.signupBtnState = ClrLoadingState.SUCCESS;
            this.message = 'You can now use your credentials to log in';
            this.complete = true;
            this.error = false;
          } else {
            this.signupBtnState = ClrLoadingState.ERROR;
            this.error = true;
          }
        },
        error => {
          console.error('authService.error: ', error);
          this.signupBtnState = ClrLoadingState.ERROR;
          this.error = true;
          this.errorMessage = error;
          this.loading = false;
        }
      );
  }

  onLoginClick() {
    this.onLoginIntent.emit();
  }

  verifyPassword() {
    this.arePasswordsSame = this.model.password === this.model.repeatPassword;
  }
}
