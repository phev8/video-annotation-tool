import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { VgAPI } from 'videogular2/core';
import { Subscription } from 'rxjs';
import { ProjectsService } from '../../projects/projects.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: [ './video.component.scss' ]
})
export class VideoComponent implements OnDestroy {
  @Input() source: String;
  @Output() playerReady: EventEmitter<VgAPI> = new EventEmitter();

  api: VgAPI;
  url: String;


  private subscription: Subscription;

  constructor(private projectsService: ProjectsService) {
    this.url = `${projectsService.projectsUrl}/files`;
  }

  onPlayerReady$(api: VgAPI) {
    this.api = api;
    this.playerReady.emit(api);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
