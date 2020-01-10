import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CanvasService } from './canvas.service';
import { Subscription } from 'rxjs';
import { CurrentToolService } from '../editor/project-toolbox.service';
import _ from 'lodash';
import { CurrentProjectService } from '../editor/current-project.service';
import { ProjectModel } from '../models/project.model';
import { TrackerModel } from '../models/tracker.model';


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

  private toolSubscription: Subscription;
  private canvasSubscription: Subscription;
  private selectedTool: number;
  private selectedLabel: string;
  private subscription: Subscription;



  private fill = '#044B94';
  private polygonElements;
  private project: ProjectModel;
  private canvasActive: boolean;
  private firstTrackable: boolean;

  constructor(
    private canvasService: CanvasService,
    private elementRef: ElementRef,
    private toolService: CurrentToolService,
    private currentProjectService: CurrentProjectService) {
  }

  ngOnInit() {
    this.subscription = this.currentProjectService.getCurrentProject$()
      .subscribe(project => {
        if (project) { this.project = project; }
      });
    this.cursor = 'crosshair';
    this.completedElements= [];
    this.selectedLabel = 'boat';
    this.toolSubscription = this.toolService.getCurrentTool$().subscribe( next => {
      if(next == 6) {
        this.model.authorId = JSON.parse(localStorage.getItem('currentSession$'))['user']['id'];
        this.model.trackerType = this.completedElements[0].tagName;
        this.model.trackables = [];
        this.completedElements.forEach(item => {
          this.model.trackables.push(JSON.stringify(item.outerHTML))
        });
        this.canvasService.updateTrackerModel(this.model, this.completedElements);
      } else {
        this.cursor = 'crosshair';
        if(next == 1) {
          this.cursor =  "grab";
        }
        this.selectedTool = next;
        this.svgElement = null;
        this.performUndo();
      }
      }
    );

    this.canvasSubscription = this.toolService.getCurrentCanvas$().subscribe(next => {
      this.completedElements = [];
      this.svgElement = null;
      this.polygonElements = null;
      if(this.svgCanvas)
        this.svgCanvas.nativeElement.innerHTML = '';
      if(next && next!='') {
        this.canvasActive = true;
        this.canvasService.getTrackingInformation(next).subscribe( (tracker:TrackerModel) => {
          this.model = tracker;
          this.firstTrackable = tracker.trackables? false: true;
          //this.completedElements = this.model.trackables? this.model.trackables: [];
          this.loadExistingTrackables(this.model.trackables);
        });
      } else {
        this.canvasActive = false;
      }
    });
  }

  @HostListener('mousedown', ['$event'])
  startDrawTouch(event: any)
  {
    switch (this.selectedTool) {
      case 0:
        this.beginPenDraw(event);
        break;
      case 1:
        this.selectElement(event);
        break;
      case 2:
        this.beginRectangleDraw(event);
        break;
      case 4:
        this.beginCircleDraw(event);
        break;
      case 5:
        this.addPin(event);
    }
  }

  @HostListener('mousemove', ['$event'])
  continueDrawTouch(event: any)
  {
    switch (this.selectedTool) {
      case 0:
        this.continuePenDraw(event);
        break;
      case 1:
        this.moveSelectedElement(event);
        break;
      case 2:
        this.continueRectangleDraw(event);
        break;
      case 4:
        this.continueCircleDraw(event);
        break;
    }
  }

  @HostListener('mouseup', ['$event'])
  endDrawTouch(event)
  {
    switch (this.selectedTool) {
      case 0:
        this.endPenDraw(event);
        break;
      case 1:
        this.endSelection(event);
        break;
      case 2:
        this.endRectangleDraw(event);
      case 4:
        this.endCircleDraw(event);
        break;
    }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseOut(event: any){
    if(this.svgElement) {
      this.svgElement = null;
    }
  }

  createSvgElement(tagName)
  {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  }

  /*
    Methods for handling pen Drawing
   */
  private beginPenDraw(event: any) {
    if(this.completedElements.length <= 0) {
      this.createNewSvgElement('polyline', {'fill':this.fill, 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000'});
      this.continuePenDraw(event);
    } else {
      CanvasComponent.promptDuplicationError('');
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

  private movePolyline(point: any, event: any) {
    if(this.svgElement) {
      let xTranslate = point.x - this.svgElement.getAttribute('origin-x');
      let yTranslate = point.y - this.svgElement.getAttribute('origin-y');
      _.each(this.svgElement.points, function (value, key) { value.x += xTranslate; value.y += yTranslate; });
      this.svgElement.setAttribute('origin-x', point.x);
      this.svgElement.setAttribute('origin-y', point.y);
      }
  }

  /*
    Methods for handling Selection
   */
  private selectElement(event: any) {
    if(this.completedElements.includes(event.target)) {
      this.cursor = "grabbing";
      this.svgElement = event.target;
      this.svgElement.setAttribute('style', "{cursor: grabbing}");
      if(this.svgElement.tagName == "polyline") {
        let point = this.generatePointOnClientElement(event);
        this.svgElement.setAttribute('origin-x', point.x);
        this.svgElement.setAttribute('origin-y', point.y);
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
          this.movePolyline(point, event);
          break;
        case 'circle':
          this.svgElement.setAttribute('cx', point.x);
          this.svgElement.setAttribute('cy', point.y);
          break;

        default: console.log(this.svgElement.tagName);
      }
    }
  }

  private endSelection(event: any) {
    if (this.svgElement) {
      this.moveSelectedElement(event);
      if(this.svgElement.tagName != "polyline")
      this.svgElement.removeAttribute('style');
      this.svgElement = null;
    }
    this.cursor = "grab";
  }

  /*
    Methods to handle rectangle drawing
   */
  private beginRectangleDraw(event: any) {
    if(this.completedElements.length <= 0) {
    let point = this.generatePointOnClientElement(event);
    this.createNewSvgElement('rect', {'fill':this.fill, 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000', 'x': point.x, 'y': point.y, width: '10', height: 10});
    this.continueRectangleDraw(event);
    } else {
      CanvasComponent.promptDuplicationError('');
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

  /*
      Methods to handle circle tool
   */
  private beginCircleDraw(event: any) {
    if(this.completedElements.length <= 0) {
    let point = this.generatePointOnClientElement(event);
    this.createNewSvgElement('circle', {'fill':this.fill, 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000', 'cx': point.x, 'cy': point.y, 'r': 0});
    this.continueCircleDraw(event);
    } else {
      CanvasComponent.promptDuplicationError('');
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
    this.svgCanvas.nativeElement.appendChild(this.svgElement);
  }

  /*
      Methods to handle undo
   */
  private performUndo() {
    if(this.selectedTool == 3) {
      let currentElement = this.completedElements.pop();
      if(currentElement) {
        this.handlePolygonPointDeletion(currentElement);
        this.svgCanvas.nativeElement.removeChild(currentElement);
      }
    }
  }

  /*
    Method to handle polygons
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
      CanvasComponent.promptDuplicationError('');
    }
  }

  private addVisualPinElement(point: any) {
    let id = this.selectedLabel+"_point"+this.polygonElements.points.numberOfItems ;
    this.createNewSvgElement('circle', {'fill': this.fill, 'fill-opacity': '0.8', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000', 'cx': point.x, 'cy': point.y, 'r': '0.2rem'}, id);
  }

  private isPreviousPinPresent() {
    return _.some(this.completedElements, {'tagName': 'polygon', 'id': this.selectedLabel});
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

  private loadExistingTrackables(trackables: string[]) {
    if(trackables.length != 0)
    trackables.forEach(trackable => {
      let item = JSON.parse(trackable);
      let createdElement = this.createSvgElement('div');
      createdElement.innerHTML = item;
      this.completedElements.push(createdElement.children[0]);
      this.svgCanvas.nativeElement.appendChild(createdElement.children[0]);
    });
  }

  private static promptDuplicationError(errorMessage: string) {
    alert('A trackable already exists for this tracker, undo existing tracker to create a new one.' + errorMessage);
  }
}
