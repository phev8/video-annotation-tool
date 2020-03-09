import {Component, Input, OnDestroy, OnInit, AfterViewInit, SimpleChanges, Output, EventEmitter} from '@angular/core';
import { Subscription } from 'rxjs';
import {CanvasService} from "../canvas.service";


@Component({
  selector: 'app-canvas-form',
  templateUrl: './canvas-modal.component.html',
  styleUrls: [ './canvas-modal.component.scss' ]
})
export class CanvasModalComponent implements OnInit, OnDestroy {
  model;
  singleMedia: boolean;

  @Input() modalOpen:boolean = false;

  @Input() pollingId: string;
  @Input() title: string;
  @Input() description: string;


  @Output() closeModal = new EventEmitter<boolean>();

  private submitted = false;
  private subscription: Subscription;
  inProgress: boolean;

  constructor(
    private canvasService: CanvasService) {
    this.inProgress = true;
  }

  ngOnInit() {
  }

  closeLoading() {
    this.inProgress = true;
    this.modalOpen = false;
    this.closeModal.emit(true);
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.pollingId.previousValue != changes.pollingId.currentValue) {
      this.pollingId = changes.pollingId.currentValue;
      if(this.pollingId != "")
        this.canvasService.startPolling(this.pollingId).subscribe(value => {
          if(value) {
            if(value["completed"]) {
              this.inProgress = false;
              this.description = "Successfully loaded tracking predictions, proceed to review the predicted results";
            } else if(value["error"]) {
              console.log(value["errorMessage"]);
              this.inProgress = false;
              this.description = "Failed to fetch predictions, proceed to manually add them";
            }
          }
        });
    }

  }


  onSubmit() {

  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
