import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AuthComponent } from './auth.component';

@NgModule({
  declarations: [ LoginComponent, SignupComponent, AuthComponent ],
  imports: [
    CommonModule,
    ClarityModule,
    FormsModule,
    HttpClientModule
  ],
  exports: [ AuthComponent ]
})
export class AuthModule {
}
