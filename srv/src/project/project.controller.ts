 import {
  Body,
  Controller,
  Delete,
  FilesInterceptor,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from '../entities/project.entity';
import { AuthGuard } from '@nestjs/passport';
import { Directory } from '../entities/directory.entity';
import { File } from '../entities/file.entity';
import { createReadStream, Stats, statSync, createWriteStream } from 'fs';
import { Request, Response } from 'express';
import * as moment from 'moment';
import * as csvStringify from 'csv-stringify';
import { LabelsService } from '../labels/labels.service';
import { SegmentService } from '../labels/segment/segment.service';
import { Label } from '../entities/label.entity';
import { Segment } from '../entities/segment.entity';
import { ObjectID } from 'mongodb';
import { config } from '../../config';
 import { LabelCategory } from '../entities/labelcategory.entity';
 import { User } from '../entities/user.entity';
 import { ProjectAnnotationResult } from '../interfaces/project.annotation';
 import { Tracker } from '../entities/tracker.entity';
 import { MarkerService } from '../labels/trackers/marker/marker.service';
 import _ from "lodash";
 import { Marker } from '../entities/markers.entity';
 import { LabelResult } from '../interfaces/label.result';
 import { FileUpload } from '../interfaces/file.upload';
 import { SegmentResult } from '../interfaces/segment.result';
 import { AnnotationResult } from '../interfaces/annotation.result';
 import { TrackerResult } from '../interfaces/tracker.result';
 import * as fs from 'fs';

@Controller('project')
export class ProjectController {

  constructor(private projectService: ProjectService,
              private labelsService: LabelsService,
              private segmentsService: SegmentService,
              private markerService: MarkerService) {
  }

  @Post()
  @UseGuards(AuthGuard())
  async create(@Req() req, @Body() body) {
    const project = new Project();
    project.title = body.title;
    project.description = body.description;
    project.singleMedia = body.singleMedia;
    project.modified = new Date();
    project.ownerId = req.user;
    project.contributorIds = [];
    project.supervisorIds = [];

    body.supervisorIds.map( userdetails => {
      project.supervisorIds.push(userdetails);
    });

    body.contributorIds.map( userdetails => {
      project.contributorIds.push(userdetails);
    });

    project.fileTree = new Directory();
    project.fileTree.parent = null;
    project.fileTree.children = [];

    const response = await this.projectService.create(project);
    return { result: response.result, id: response.insertedId };
  }

  @Post('invite/:id')
  @UseGuards(AuthGuard())
  async inviteMembers(@Param('id') id, @Req() req, @Body() body) {
    const project: Project = await this.projectService.findOne(id);
    project.supervisorIds = req.project.supervisorIds;
    project.contributorIds = req.project.contributorIds;
    return await this.projectService.update(project.id.toHexString(), project);
  }

  @Post('upload/:id')
  @UseGuards(AuthGuard())
  @UseInterceptors(FilesInterceptor('file'))
  async uploadFile(@Param('id') id, @UploadedFiles() uploads: FileUpload[]) {
    const project = await this.projectService.findOne(id);
    if(!(project.singleMedia && project.fileTree.size == 1)) {
      uploads.forEach((upload: FileUpload) => {
        if (upload.filename) {
          const file = new File();

          file.name = upload.originalname;
          file.filename = upload.filename;
          file.path = upload.path;
          file.size = upload.size;
          file.mimetype = upload.mimetype;

          project.fileTree.children.push(file);
        }
      });
    }
    return await this.projectService.update(project.id.toHexString(), project);
  }

  @Get('all/:ownerId')
  @UseGuards(AuthGuard())
  async findAll(@Param('ownerId') ownerId): Promise<Project[]> {
    return await this.projectService.findAll(ownerId);
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  async findOne(@Param('id') id) {
    const project: Project = await this.projectService.findOne(id);
    project.fileTree.children.forEach(file => {
      delete file.path;
    });
    return project;
  }

  @Get('files/:filename')
  // @UseGuards(AuthGuard()) fixme
  file(@Req() req: Request, @Res() res: Response, @Param('filename') filename: string) {
    const path = `${config.multerDest}/${filename}`;
    const stat: Stats = statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunckSize = (end - start) + 1;
      const file = createReadStream(path, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunckSize,
        'Content-Type': 'video/mp4', // fixme
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      createReadStream(path).pipe(res);
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard())
  async updateProject(@Param('id') id, @Body() body) {
    const project = await this.projectService.findOne(id);
    if (body) {
      project.videoDimensions = body['videoDimensions'];
      await this.projectService.update(id, project);
    }
    return project;
  }

  @Put(':id/members')
  @UseGuards(AuthGuard())
  async update(@Param('id') id, @Body() body: Project) {
    const project = await this.projectService.findOne(id);
    let memberIds = [];
    if (body) {
      let members:User[] = body['contributorIds'];
      for (var member of members) {
        memberIds.push(ObjectID.createFromHexString(member));
      }
      project.contributorIds = memberIds;
      memberIds = [];
      members = body['supervisorIds'];
      for (var member of members) {
        memberIds.push(ObjectID.createFromHexString(member));
      }
      project.supervisorIds = memberIds;
      return await this.projectService.update(id, project);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  async delete(@Param('id') projectId) {
    await this.labelsService.deleteProjectLabelCategories(projectId);
    return await this.projectService.delete(projectId);
  }

  @Get(':id/segments/csv')
  async getSegments(@Param('id') projectId, @Res() res) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Disposition', `attachment; filename="download-${moment()}.csv"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    const labels: Label[] = await this.labelsService.getLabels(projectId, ['id', 'name']);
    const labelledSegments: Segment[][] = await Promise.all(labels.map(x => this.segmentsService.getSegments(x.id.toHexString())));

    const response = [];
    const names = new Map<string, string>(labels.map((x: Label) => ([x.id.toHexString(), x.name] as [string, string])));
    labelledSegments.forEach(segments => {
        segments.forEach(segment =>
          response.push({ name: names.get(segment.labelId), start: segment.start, end: segment.end }),
        );
      },
    );
    csvStringify(response, { header: true }).pipe(res);
  }


  @Get(':id/annotations')
  async generateAnnotations(@Param('id') projectId) {
    //Needs refactoring
    const labelCategories: LabelCategory[] = await this.labelsService.getLabelCategories(projectId);
    const project: Project = await this.projectService.findOne(projectId);
    let modifiedResponse: ProjectAnnotationResult = new ProjectAnnotationResult(project.title, project.singleMedia);
    if(modifiedResponse.singleMedia) {
      let dimensions = project.videoDimensions.split(" ");
      modifiedResponse.videoDimensionsX = +dimensions[0];
      modifiedResponse.videoDimensionsY = +dimensions[1];
    }

    for (const category of labelCategories) {
      let categoryResponse: AnnotationResult = {categoryName: category.name, labels: []};
      for (const label of category.labels) {
        let labelResult: LabelResult = {labelName: label.name, segments: []};
        let segments: Segment[] = await this.segmentsService.getSegments(label["_id"].toHexString());
        for (const segment of segments) {
          let segmentResult: SegmentResult = {start: segment.start, end: segment.end, trackable: category.isTrackable};
          if(category.isTrackable)
            segmentResult.trackers = await this.markerService.fetchTrackerResults(segment.id.toHexString());
          labelResult.segments.push(segmentResult);
        }
        categoryResponse.labels.push(labelResult);
      }
      modifiedResponse.annotations.push(categoryResponse);
    }
    return JSON.stringify(modifiedResponse, null, 4);
  }
}
