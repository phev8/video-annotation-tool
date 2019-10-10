import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: [ './auth.component.scss' ]
})
export class AuthComponent implements OnInit {
  isLogin = true;
  appName = 'Annotation Tool';

  constructor() {
  }

  ngOnInit() {
  }

  onRegisterIntent() {
    this.isLogin = false;
  }

  onLoginIntent() {
    this.isLogin = true;
  }
}
