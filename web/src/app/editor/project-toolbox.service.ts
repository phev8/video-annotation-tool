import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CurrentToolService {

  private toolBoxEnabled: BehaviorSubject<boolean>;
  private readonly toolBoxStatus$: Observable<boolean>;
  private selectedToolBox: BehaviorSubject<number>;
  private readonly selectedTool$: Observable<number>;
  private canvasEnabled: BehaviorSubject<string>;
  private readonly selectedCanvas$: Observable<string>;

  constructor() {
    this.toolBoxEnabled = new BehaviorSubject(false);
    this.toolBoxStatus$ = this.toolBoxEnabled.asObservable();
    this.selectedToolBox = new BehaviorSubject(0);
    this.selectedTool$ = this.selectedToolBox.asObservable();
    this.canvasEnabled = new BehaviorSubject('');
    this.selectedCanvas$ = this.canvasEnabled.asObservable();
  }

  triggerCanvas(trackerId: string) {
    this.canvasEnabled.next(trackerId);
  }


  triggerToolBox(isTrackable: boolean) {
    this.toolBoxEnabled.next(isTrackable);
  }

  updateSelectedTool(index: number) {
    this.selectedToolBox.next(index);
  }

  getCurrentToolBoxStatus$(): Observable<boolean> {
    return this.toolBoxStatus$;
  }

  getCurrentTool$(): Observable<number> {
    return this.selectedTool$;
  }

  getCurrentCanvas$():  Observable<string> {
    return this.selectedCanvas$;
  }
}
