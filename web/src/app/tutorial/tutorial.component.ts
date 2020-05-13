import { Component, OnInit } from '@angular/core';
import { TutorialService } from './tutorial.service';
import { AuthService } from '../auth/auth.service';
import { CurrentToolService } from '../editor/project-toolbox.service';
import {Subscription} from "rxjs";

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: [ 'tutorial.component.scss' ],
})
export class TutorialComponent implements OnInit {


  constructor(private tutorialService: TutorialService,
              private authService: AuthService,
              private toolBoxService: CurrentToolService) {
  }

  ngOnInit() {
  }

  refresh() {
  }
}
