import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CanvasService } from './canvas.service';
import { Subscription } from 'rxjs';
import { CurrentToolService } from '../editor/project-toolbox.service';


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

  private toolSubscription: Subscription;
  private selectedTool: number;
  private selectedElement;

  constructor(
    private canvasService: CanvasService,
    private elementRef: ElementRef,
    private toolService: CurrentToolService) {
  }

  ngOnInit() {
    this.cursor = 'crosshair';
    this.completedElements= [];
    this.toolSubscription = this.toolService.getCurrentTool$().subscribe( next => {
      this.cursor = 'crosshair';
      if(next == 1) {
        this.cursor =  "grab";
      }
      this.selectedTool = next;
      this.svgElement = null;
      this.performUndo();
      }
    );
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
    this.createNewSvgElement('polyline', {'fill':'#044B94', 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000'});
    this.continuePenDraw(event);
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

  /*
    Methods for handling Selection
   */
  private selectElement(event: any) {
    if(this.completedElements.includes(event.target)) {
      this.cursor = "grabbing";
      this.svgElement = event.target;
    }
  }

  private moveSelectedElement(event: any) {
    if (this.svgElement) {
      switch(this.svgElement.tagName) {
        case 'rect':
          let point = this.generatePointOnClientElement(event);
          this.svgElement.setAttribute('x', point.x);
          this.svgElement.setAttribute('y', point.y);
          break;
        default: console.log(this.svgElement.tagName);
      }
    }
  }

  private endSelection(event: any) {
    if (this.svgElement) {
      this.moveSelectedElement(event);
      this.svgElement = null;
    }
    this.cursor = "grab";
  }

  /*
    Methods to handle rectangle drawing
   */
  private beginRectangleDraw(event: any) {
    let point = this.generatePointOnClientElement(event);
    this.createNewSvgElement('rect', {'fill':'#044B94', 'fill-opacity': '0.3', 'shape-rendering': 'geometricPrecision', 'stroke-linejoin': 'round', 'stroke': '#000000', 'x': point.x, 'y': point.y, width: '10', height: 10});
    this.continueRectangleDraw(event);
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

  private createNewSvgElement(tagName: string, attributes: object) {
    this.svgElement = this.createSvgElement(tagName);
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
      if(currentElement)
      this.svgCanvas.nativeElement.removeChild(currentElement);
    }
  }
}
