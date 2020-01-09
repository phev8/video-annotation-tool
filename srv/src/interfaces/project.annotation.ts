import { AnnotationResult } from './annotation.result';

export class ProjectAnnotationResult {
  projectName: string;
  singleMedia?: boolean;
  videoDimensionsX?: number;
  videoDimensionsY?: number;
  annotations?: AnnotationResult[];
  modifiedResponse: any;

  constructor(
    projectName: string, singleMedia: boolean) {
    this.projectName = projectName;
    this.singleMedia = singleMedia;
    this.annotations = [];
  };
}