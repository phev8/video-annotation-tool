import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CanvasService } from './canvas.service';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import { CurrentToolService } from '../editor/project-toolbox.service';
import _ from 'lodash';
import { CurrentProjectService } from '../editor/current-project.service';
import { ProjectModel } from '../models/project.model';
import { TrackerModel } from '../models/tracker.model';
import {AlertService} from "../alert.service";
const ToolkitModel = { PENCIL: 0, MOVE: 1, RECTANGLE: 2, UNDO: 3, CIRCLE: 4, PIN: 5, SAVE: 6,};

/**
 * Canvas handles the drawing, storing and loading of the tracking data,
 * for a particular time instance of a trackable label in the time line.
 */
@Component({
  selector: 'drawing-board',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements OnInit {

  @ViewChild('svg_canvas') svgCanvas: ElementRef;
  private svgElement;
  private cursor;
  private completedElements;
  private model: TrackerModel;
  private modalOpen: boolean;
  private description: string;
  private title: string;
  private pollingId: string;

  private toolSubscription: Subscription;
  private selectedTool: number;
  private selectedLabel: string;
  private subscription: Subscription;



  private fill = '#044B94';
  private polygonElements;
  private project: ProjectModel;
  canvasActive: boolean = false;
  private firstTrackable: boolean;

  constructor(
    private canvasService: CanvasService,
    private elementRef: ElementRef,
    private toolService: CurrentToolService,
    private currentProjectService: CurrentProjectService,
    private alertService: AlertService) {
    this.closeCanvasModal();
  }

  /**
   * Method adds the necessary subscriptions to each canvas associated with a tracker, the selected tool,
   * the current project and the selected tracking label and color. Also initializes the cursor,
   * the completed elements and selected Labels.
   */
  ngOnInit() {
    this.subscribeToProject();
    this.cursor = 'crosshair';
    this.completedElements= [];
    this.selectedLabel = '';
    this.addToolServiceSubscriptions();
  }

  /**
   * Method that updates the selected tool according to the selection triggered by the toolbox.
   * Also adds the subscription to load an existing canvas if available when a marker on the timeline
   * is selected.
   * In addition, it also handles saving the created tracking data, and updates other configurations
   * such as the selected cursor, selected tracking color, tracking undo requests and initializes the
   * current element being constructed.
   */
  private addToolServiceSubscriptions() {
    this.toolSubscription = this.toolService.getCurrentTool$().subscribe(next => {
      if (next == ToolkitModel.SAVE) {
        if(this.completedElements.length > 0)
          this.saveTrackingInformation();
        else
          this.alertService.createNewAlert({
            type: 'warning',
            text: 'No tracking information has been added for the current marker',
            action: ''
          });
      } else {
        this.cursor = 'crosshair';
        if (next == ToolkitModel.MOVE) {
          if(this.polygonElements) {
            this.makePolygonPointsDraggable();
          }
          this.cursor = 'grab';
        }
        this.selectedTool = next;
        this.svgElement = null;
        this.performUndo();
      }
    });
    this.subscribeToCanvas();
    this.subscribeToTrackerColor();
  }

  /**
   * Handles the update of the tracker color, based on the selection from the
   * color picker in the tool box.
   */
  private subscribeToTrackerColor() {
    this.toolSubscription.add(this.toolService.getCurrentColor$().subscribe(next => {
      if (next) {
        this.fill = next;
        this.changeColorOnElements();
      }
    }));
  }

  /**
   * Method to load existing tracking data and render them on the drawing board
   * as svg elements. Does so only for projects where single media type is set to true.
   */
  private subscribeToCanvas() {
    this.toolSubscription.add(this.toolService.getCurrentCanvas$().subscribe(next => {
      if (this.project && this.project.singleMedia) {
        this.loadExistingCanvas(next);
      }
    }));
  }

  /**
   * Loads the details of the current project being viewed in the editor.
   * Used to fetch information regarding singleMedia type of a project.
   */
  private subscribeToProject() {
    this.subscription = this.currentProjectService.getCurrentProject$()
      .subscribe(project => {
        if (project) {
          this.project = project;
        }
      });
  }

  /**
   * Sets the current drawing board to active if the parameter next is valid, i.e,
   * it contains a valid tracker id and label name. Sets the selected label, initializes the
   * current element, and other required variables. Also calls the method to fetch tracking data.
   *
   * @param next - is a ';' separated string consisting of the tracker Id and the name
   *        of the label instance being tracked.
   */
  private loadExistingCanvas(next) {
    this.completedElements = [];
    this.svgElement = null;
    this.polygonElements = null;
    if (this.svgCanvas)
      this.svgCanvas.nativeElement.innerHTML = '';
    if (next && next != '') {
      let trackerInfo = next.split(';');
      this.canvasActive = true;
      this.selectedLabel = trackerInfo[1];
      this.fetchTracker(trackerInfo);
    } else {
      this.canvasActive = false;
    }
  }

  /**
   * Initializes the model with the fetched tracker and updates the color from the same.
   * In addition, calls the method to generate the svg elements for each trackable.
   *
   * @param trackerInfo - is a string array consisting of the tracker Id and the name
   *        of the label instance being tracked respectively.
   */
  private fetchTracker(trackerInfo) {
    this.canvasService.getTrackingInformation(trackerInfo[0]).subscribe((tracker: TrackerModel) => {
      this.model = tracker;
      this.firstTrackable = tracker.trackables ? false : true; //do not simplify this, it is an empty check, not boolean assignment
      if (tracker.selectedColor) {
        this.fill = tracker.selectedColor;
        this.toolService.updateSelectedColor(tracker.selectedColor);
      }
      this.generateSVGforTracking(this.model.trackables);
    });
  }

  /**
   * Method makes the call to store the tracking data with the linked tracking id.
   */
  private saveTrackingInformation() {
    if (this.completedElements.length > 0) {
      this.model.authorId = JSON.parse(localStorage.getItem('currentSession$'))['user']['id'];
      this.model.trackerType = this.completedElements[0].tagName;
      this.model.labelName = this.selectedLabel;
      this.model.trackables = [];
      this.model.selectedColor = this.fill;
      this.completedElements.forEach(item => {
        this.model.trackables.push(JSON.stringify(item.outerHTML));
      });
      this.canvasService.updateTrackerModel(this.model, this.project.videoDimensions, this.project.fileTree.children[0].filename).subscribe(val => {
          this.alertService.createNewAlert({
            type: 'success',
            text: 'Tracking saved successfully',
            action: ''
          });
          this.canvasService.updateTracker(this.model.labelId);
          if(val && val != '') {
            this.openLoadingModal(val.toString());
          }
        },
        error => {console.log("PUT call in error", error);},
        () => {console.log("The PUT observable is now completed.");});
    } else {
      this.alertService.createNewAlert({
        type: 'warning',
        text: 'No tracking information has been added for the current marker',
        action: ''
      });
      //alert('No tracking information has been added for the current marker');
    }
  }

  /**
   * Method that tracks the beginning of the generation of svg elements
   * from the user input on the canvas. Directs each start based on the type
   * of the tool selected in the toolbox.
   *
   * @param event - Consists of the mouse down event and associated information.
   */
  @HostListener('mousedown', ['$event'])
  startDrawTouch(event: any)
  {
    switch (this.selectedTool) {
      case ToolkitModel.PENCIL:
        this.beginPenDraw(event);
        break;
      case ToolkitModel.MOVE:
        this.selectElement(event);
        break;
      case ToolkitModel.RECTANGLE:
        this.beginRectangleDraw(event);
        break;
      case ToolkitModel.CIRCLE:
        this.beginCircleDraw(event);
        break;
      case ToolkitModel.PIN:
        this.addPin(event);
    }
  }

  /**
   * Method is called after the initial mouse click performed by the user.
   * This method continuously updates the svg elements that have been previously
   * created.
   *
   * @param event - Consists of the mouse move event and associated information.
   */
  @HostListener('mousemove', ['$event'])
  continueDrawTouch(event: any)
  {
    switch (this.selectedTool) {
      case ToolkitModel.PENCIL:
        this.continuePenDraw(event);
        break;
      case ToolkitModel.MOVE:
        this.moveSelectedElement(event);
        break;
      case ToolkitModel.RECTANGLE:
        this.continueRectangleDraw(event);
        break;
      case ToolkitModel.CIRCLE:
        this.continueCircleDraw(event);
        break;
    }
  }

  /**
   * Method called to signify the end of the user mouse interaction and the completion
   * of the svg element being created or moved by the user.
   *
   * @param event - Consists of the mouse up event and associated information.
   */
  @HostListener('mouseup', ['$event'])
  endDrawTouch(event)
  {
    switch (this.selectedTool) {
      case ToolkitModel.PENCIL:
        this.endPenDraw(event);
        break;
      case ToolkitModel.MOVE:
        this.endSelection(event);
        break;
      case ToolkitModel.RECTANGLE:
        this.endRectangleDraw(event);
        break;
      case ToolkitModel.CIRCLE:
        this.endCircleDraw(event);
        break;
    }
  }

  /**
   * Method primarily resets the current element when the mouse leaves
   * the area of the canvas.
   *
   * @param event - triggered when the mouse leaves the canvas area.
   */
  @HostListener('mouseleave', ['$event'])
  onMouseOut(event: any){
    if(this.svgElement) {
      this.svgElement = null;
    }
  }

  // ============================================== RECTANGLE RELATED METHODS ======================================================================================
  /*
    Methods that handle the beginning of drawing a rectangle, continuing the extension of its size and completing accordingly.
   */
  private beginRectangleDraw(event: any) {
    if(this.completedElements.length <= 0) {
      let point = this.generatePointOnClientElement(event);
      this.createNewSvgElement('rect', {'fill':this.fill, 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000', 'x': point.x, 'y': point.y, width: '10', height: 10});
      this.continueRectangleDraw(event);
    } else {
      this.promptDuplicationError('');
    }
  }

  private continueRectangleDraw(event: any) {
    if (this.svgElement) {
      let point = this.generatePointOnClientElement(event);
      this.adjustDimensionsOfRectangle(point);
    }
  }

  private adjustDimensionsOfRectangle(point) {
    let width = point.x - this.svgElement.getAttribute('x');
    if(width < 0) {
      this.svgElement.setAttribute('x', point.x);
    }
    let height = point.y - this.svgElement.getAttribute('y');
    if(height < 0) {
      this.svgElement.setAttribute('y', point.y);
    }
    this.svgElement.setAttribute('width', Math.abs(width));
    this.svgElement.setAttribute('height', Math.abs(height));
  }

  private endRectangleDraw(event: any) {
    if (this.svgElement) {
      this.continueRectangleDraw(event);
      this.svgElement = null;
    }
  }

  // ============================================== CIRCLE RELATED METHODS ======================================================================================
  /**
   * Methods that handle the beginning of drawing a CIRCLE, continuing the extension its radius and completing accordingly.
  */
  private beginCircleDraw(event: any) {
    if(this.completedElements.length <= 0) {
      let point = this.generatePointOnClientElement(event);
      this.createNewSvgElement('circle', {'fill':this.fill, 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000', 'cx': point.x, 'cy': point.y, 'r': 0});
      this.continueCircleDraw(event);
    } else {
      this.promptDuplicationError('');
    }
  }

  private continueCircleDraw(event: any) {
    if (this.svgElement) {
      let point = this.generatePointOnClientElement(event);
      this.adjustCircleDimensions(point);
    }
  }
  private adjustCircleDimensions(point) {
    let width = point.x - this.svgElement.getAttribute('cx');
    let height = point.y - this.svgElement.getAttribute('cy');
    this.svgElement.setAttribute('r', Math.hypot(width, height));
  }

  private endCircleDraw(event: any) {
    if (this.svgElement) {
      this.continueCircleDraw(event);
      this.svgElement = null;
    }
  }

  // ============================================== PENCIL RELATED METHODS : UNBOUNDED TRACKING - START AND END POINTS NOT THE SAME ======================================================================================
  /**
   * Methods that handle the beginning of drawing with a pencil, continuing the extension of the line and completing accordingly.
   */
  private beginPenDraw(event: any) {
    if(this.completedElements.length <= 0) {
      this.createNewSvgElement('polyline', {'fill':this.fill, 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000'});
      this.continuePenDraw(event);
    } else {
      this.promptDuplicationError('');
    }
  }

  private continuePenDraw(event: any) {
    if (this.svgElement) {
      let point = this.generatePointOnClientElement(event);
      this.svgElement.points.appendItem(point);
    }
  }

  private endPenDraw(event) {
    if (this.svgElement) {
      this.continuePenDraw(event);
      this.svgElement = null;
    }
  }

  // ============================================== PIN RELATED METHODS : BOUNDED TRACKING - START AND END POINTS ARE THE SAME ======================================================================================

  /**
   * Method to handle polygons, their creation and completion. Unlike other methods, this is considered in a way where each new pin
   * extends the area within the polygon.
   */
  private addPin(event: any) {
    if(this.completedElements.length <= 0 || this.isPreviousPinPresent()) {
      let point = this.generatePointOnClientElement(event);
      if(!this.isPreviousPinPresent()) {
        this.createNewSvgElement('polygon', {'fill': this.fill, 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000'});
        this.polygonElements = this.svgElement;
      }
      this.polygonElements.points.appendItem(point);
      this.addVisualPinElement(point);
    } else {
      this.promptDuplicationError('');
    }
  }

  private addVisualPinElement(point: any) {
    let id = this.selectedLabel+"_point"+this.polygonElements.points.numberOfItems ;
    this.createNewSvgElement('circle', {'fill': this.fill, 'fill-opacity': '0.8', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000', 'cx': point.x, 'cy': point.y, 'r': '0.2rem'}, id);
  }

  private isPreviousPinPresent() {
    return _.some(this.completedElements, {'tagName': 'polygon', 'id': this.selectedLabel});
  }

  // ============================================== SELECTION AND MOVE RELATED METHODS ======================================================================================

  /**
   * Methods for handling Selection, i.e, identifying the element selected, and then performing translation
   * on the co-ordinates of the selected item. Methods are identical for most tracker types except for polyline
   * since that requires a translation of all points of the polyline.
   * TODO: Moving a bounded polygon, i.e, with pins remains unimplemented.
   */
  private selectElement(event: any) {
    if(this.completedElements.includes(event.target)) {
      this.cursor = "grabbing";
      this.svgElement = event.target;
      this.svgElement.setAttribute('style', "{cursor: grabbing}");
      if(this.svgElement.tagName == "polyline" || this.svgElement.tagName == "polygon") {
        let point = this.generatePointOnClientElement(event);
        this.svgElement.setAttribute('origin-x', point.x);
        this.svgElement.setAttribute('origin-y', point.y);
      }
      if(this.svgElement.tagName == "circle" && this.polygonElements) {
        let point = this.generatePointOnClientElement(event);
        this.svgElement.setAttribute('origin-x', this.svgElement.getAttribute('cx'));
        this.svgElement.setAttribute('origin-y', this.svgElement.getAttribute('cy'));
      }
    }
  }

  private moveSelectedElement(event: any) {
    if (this.svgElement) {
      let point = this.generatePointOnClientElement(event);
      switch(this.svgElement.tagName) {
        case 'rect':
          this.svgElement.setAttribute('x', point.x);
          this.svgElement.setAttribute('y', point.y);
          break;
        case 'polyline':
          this.movePolyline(point);
          break;
        case 'circle':
          this.svgElement.setAttribute('cx', point.x);
          this.svgElement.setAttribute('cy', point.y);
          break;
        case "polygon":
          this.movePolygon(point);
          break;

        default: console.log(this.svgElement.tagName);
      }
    }
  }

  private endSelection(event: any) {
    if (this.svgElement) {
      this.moveSelectedElement(event);
      if(this.polygonElements && this.svgElement.tagName == 'circle') {
        let point = this.generatePointOnClientElement(event);
        this.movePolygonCircle(point);
      }
      if(this.svgElement.tagName != "polyline")
        this.svgElement.removeAttribute('style');
      this.svgElement = null;

    }
    this.cursor = "grab";
  }

  private movePolyline(point: any) {
    if(this.svgElement) {
      let xTranslate = point.x - this.svgElement.getAttribute('origin-x');
      let yTranslate = point.y - this.svgElement.getAttribute('origin-y');
      _.each(this.svgElement.points, function (value, key) { value.x += xTranslate; value.y += yTranslate; });
      this.svgElement.setAttribute('origin-x', point.x);
      this.svgElement.setAttribute('origin-y', point.y);
      }
  }

  private movePolygon(point: any) {
    if(this.svgElement) {
      let xTranslate = point.x - this.svgElement.getAttribute('origin-x');
      let yTranslate = point.y - this.svgElement.getAttribute('origin-y');
      _.each(this.svgElement.points, function (value, key) { value.x += xTranslate; value.y += yTranslate; });
      _.each(this.completedElements, function (value, key) {
        if(value.tagName == 'circle') {
          value.setAttribute('cx', parseFloat(value.getAttribute('cx')) + xTranslate);
          value.setAttribute('cy', parseFloat(value.getAttribute('cy')) + yTranslate);
        }
      });
      this.svgElement.setAttribute('origin-x', point.x);
      this.svgElement.setAttribute('origin-y', point.y);
    }
  }

  private movePolygonCircle(point: any) {
    let xOriginal = this.svgElement.getAttribute('origin-x');
    let yOriginal = this.svgElement.getAttribute('origin-y');
    _.each(this.polygonElements.points, function (value, key) {
      if(value.x == xOriginal && value.y == yOriginal ) {
        console.log("First one in");
        value.x = point.x;
        value.y = point.y;
      }
    });

  }
  // ============================================== UNDO AND DELETION RELATED METHODS ======================================================================================
  /**
   * Methods to handle undo, special condition to undo pins since each pin or point requires
   * removal of both the point as well the visual circle used to represent the pin.
   */
  private performUndo() {
    if(this.selectedTool == ToolkitModel.UNDO) {
      let currentElement = this.completedElements.pop();
      if(currentElement) {
        this.handlePolygonPointDeletion(currentElement);
        this.svgCanvas.nativeElement.removeChild(currentElement);
      }
    }
  }

  private handlePolygonPointDeletion(currentElement: any) {
    if(currentElement.tagName == "circle" && currentElement.id.startsWith(this.selectedLabel+"_")) {
      for(let i=0; i<this.polygonElements.points.numberOfItems; i++) {
        if(this.polygonElements.points.getItem(i).x == currentElement.getAttribute('cx') && this.polygonElements.points.getItem(i).y == currentElement.getAttribute('cy')) {
          this.polygonElements.points.removeItem(i);
        }
      }
    }
  }

  // ============================================== SVG UTILITY METHODS ======================================================================================

  /**
   * Creates new svg elements for each tracking data. This method is called when an initial load is performed
   * to fetch any existing trackables for the selected tracker.
   *
   * @param trackables : string[] Consists of tracking elements previously associated with the selected tracker.
   */
  private generateSVGforTracking(trackables: string[]) {
    if(trackables.length != 0) {
      let isPolygon = false;
      trackables.forEach(trackable => {
        let item = JSON.parse(trackable);
        let createdElement = this.createSvgElement('div');
        createdElement.innerHTML = item;
        if(createdElement.children[0].tagName == "polygon") {
          isPolygon = true;
          createdElement.children[0]["points"].clear();
          this.polygonElements = createdElement.children[0];
        }
        if(createdElement.children[0].tagName == "circle" && isPolygon) {
          let point = this.svgCanvas.nativeElement.createSVGPoint();
          point.x = createdElement.children[0].getAttribute('cx');
          point.y = createdElement.children[0].getAttribute('cy');
          this.polygonElements.points.appendItem(point);
        }
        this.completedElements.push(createdElement.children[0]);
        if(this.svgCanvas)
          this.svgCanvas.nativeElement.appendChild(createdElement.children[0]);
      });
    }
  }

  /**
   * Method to fetch point co-ordinates on the canvas from the
   * triggered event.
   * @param event
   */
  private generatePointOnClientElement(event: any) {
    let point;
    if(this.svgElement)
      point = this.svgElement.ownerSVGElement.createSVGPoint();
    else
      point = event.target.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    let ctm = event.target.getScreenCTM();
    if (ctm = ctm.inverse()) {
      point = point.matrixTransform(ctm);
    }
    return point;
  }

  /**
   * Called by methods that are associated with beginning the generation
   * of various trackables. Creates a svg elements and links it to the
   * current element being generated.
   *
   * @param tagName
   * @param attributes
   * @param id
   */
  private createNewSvgElement(tagName: string, attributes: object, id?: string) {
    this.svgElement = this.createSvgElement(tagName);
    this.svgElement.id = this.selectedLabel;
    if(id) {
      this.svgElement.id = id;
    }
    this.completedElements.push(this.svgElement);
    for(let key in attributes) {
      this.svgElement.setAttribute(key, attributes[key]);
    }
    let title = this.createSvgElement("title");
    title.innerHTML = this.selectedLabel;
    this.svgElement.appendChild(title);
    this.svgElement.setAttribute("title", this.selectedLabel);
    this.svgCanvas.nativeElement.appendChild(this.svgElement);
  }

  /**
   * Creates a dom element with the name provided to the method.
   *
   * @param tagName : name of the element to be created.
   */
  createSvgElement(tagName)
  {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  }

  private promptDuplicationError(errorMessage: string) {
    this.alertService.createNewAlert({
      type: 'danger',
      text: 'A trackable already exists for this tracker, undo existing tracker to create a new one.' + errorMessage,
      action: ''
    });
  }

  /*
    Method to replace the fill color on existing elements when
    a color change is triggered by the toolbox.
   */
  private changeColorOnElements() {
    if(this.svgCanvas && this.canvasActive) {
      for(let child of this.svgCanvas.nativeElement.children) {
        if(child.getAttribute("fill")) {
          child.setAttribute("fill", this.fill);
        }
      }
    }
  }

  private makePolygonPointsDraggable() {
    for(let circle of this.elementRef.nativeElement.getElementsByTagName('circle'))
      circle.setAttribute('cursor', 'move');
  }


  // ============================================== CANVAS MODAL METHODS ======================================================================================

  /**
   * Opens the modal that display loading the predictions for the tracking.
   *
   * @param val : string Consists of the polling Id that is checked to see if predictions are completed
   */
  private openLoadingModal(val: string) {
    this.pollingId = val;
    this.title = 'Tracking Object';
    this.description = 'Predicting location of tracked object across the segment';
    this.modalOpen = true;
  }

  /**
   * Listener for the closure of the modal
   *
   * @param closed : boolean
   */
  modalClosed(closed: boolean) {
    if(closed) {
      this.closeCanvasModal();
    }
  }

  /**
   * Method to clear parameters involved in opening a modal
   */
  private closeCanvasModal() {
    this.modalOpen = false;
    this.description = '';
    this.title = '';
    this.pollingId = '';
  }
}
