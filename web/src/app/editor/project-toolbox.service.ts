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
  private toolBoxColor: BehaviorSubject<string>;
  private readonly selectedColor$: Observable<string>;
  private itemsSelected: BehaviorSubject<boolean>;
  private readonly itemSelectStatus$: Observable<boolean>;

  constructor() {
    this.toolBoxEnabled = new BehaviorSubject(false);
    this.toolBoxStatus$ = this.toolBoxEnabled.asObservable();
    this.selectedToolBox = new BehaviorSubject(-1);
    this.selectedTool$ = this.selectedToolBox.asObservable();
    this.canvasEnabled = new BehaviorSubject('');
    this.selectedCanvas$ = this.canvasEnabled.asObservable();
    this.toolBoxColor = new BehaviorSubject('#044B94');
    this.selectedColor$ = this.toolBoxColor.asObservable();
    this.itemsSelected = new BehaviorSubject(true);
    this.itemSelectStatus$ = this.itemsSelected.asObservable();
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

  updateSelectedColor(change: string) {
    this.toolBoxColor.next(change);
  }

  updateItemSelectStatus(status: boolean) {
    this.itemsSelected.next(status);
  }

  getCurrentColor$():  Observable<string> {
    return this.selectedColor$;
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

  getCurrentItemStatus$(): Observable<boolean> {
    return this.itemSelectStatus$;
  }
}
