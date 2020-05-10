import {
  Body,
  Controller,
  Delete,
  FilesInterceptor,
  Get, Header, Logger,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {ProjectService} from './project.service';
import {Project} from '../entities/project.entity';
import {AuthGuard} from '@nestjs/passport';
import {File} from '../entities/file.entity';
import {createReadStream, Stats, statSync} from 'fs';
import {Request, Response} from 'express';
import * as moment from 'moment';
import * as csvStringify from 'csv-stringify';
import {LabelsService} from '../labels/labels.service';
import {SegmentService} from '../labels/segment/segment.service';
import {Label} from '../entities/label.entity';
import {Segment} from '../entities/segment.entity';
import {ObjectID} from 'mongodb';
import {config} from '../../config';
import {LabelCategory} from '../entities/labelcategory.entity';
import {User} from '../entities/user.entity';
import {ProjectAnnotationResult} from '../interfaces/project.annotation';
import {MarkerService} from '../labels/trackers/marker/marker.service';
import {LabelResult} from '../interfaces/label.result';
import {FileUpload} from '../interfaces/file.upload';
import {SegmentResult} from '../interfaces/segment.result';
import {AnnotationResult} from '../interfaces/annotation.result';
import {RecommendationService} from '../recommendations/recommendation.service';
import {Pollingstatus} from '../entities/pollingstatus.entity';
import {LabelsGateway} from '../labels/labels.gateway';
import {UsersService} from '../users/users.service';
import * as fs from 'fs';
import {UserModel} from '../users/user.model';

@Controller('project')
export class ProjectController {

  private readonly logger = new Logger(ProjectController.name);

  constructor(private projectService: ProjectService,
              private labelsService: LabelsService,
              private segmentsService: SegmentService,
              private markerService: MarkerService,
              private recommendationService: RecommendationService,
              private labelsGateway: LabelsGateway,
              private userService: UsersService) {
  }

  @Post()
  @UseGuards(AuthGuard())
  @Header('content-type', 'application/json')
  async create(@Req() req, @Body() body) {
    this.logger.log('INCOMING PROJECT CREATION REQUEST : ' + JSON.stringify(body));
    body.ownerId = req.user;
    const project = new Project(body);
    const response = await this.projectService.create(project);
    this.logger.log('RESPONSE : ' + JSON.stringify({ result: response.result, id: response.insertedId }));
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
    if (!(project.singleMedia && project.fileTree.size === 1)) {
      uploads.forEach((upload: FileUpload) => {
        if (upload.filename) {
          const file = new File(upload);
          project.fileTree.children.push(file);
        }
      });
    }
    return await this.projectService.update(project.id.toHexString(), project);
  }

  @Get('all/:userId')
  @UseGuards(AuthGuard())
  async findAll(@Param('userId') userId): Promise<Project[]> {
    return await this.projectService.findAll(userId);
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
      project.videoDimensions = body.videoDimensions;
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
      let members: User[] = body.contributorIds;
      for (const member of members) {
        memberIds.push(ObjectID.createFromHexString(member));
      }
      project.contributorIds = memberIds;
      memberIds = [];
      members = body.supervisorIds;
      for (const member of members) {
        memberIds.push(ObjectID.createFromHexString(member));
      }
      project.supervisorIds = memberIds;
      return await this.projectService.update(id, project);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  async delete(@Param('id') projectId) {
    await this.labelsService.deleteProjectLabelCategories(projectId).then(result => {});
    await this.removeVideoFiles(projectId);
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
    const labelCategories: LabelCategory[] = await this.labelsService.getLabelCategories(projectId);
    const project: Project = await this.projectService.findOne(projectId);
    const modifiedResponse: ProjectAnnotationResult = new ProjectAnnotationResult(project.title, project.singleMedia);
    if (modifiedResponse.singleMedia) {
      const dimensions = project.videoDimensions.split(' ');
      modifiedResponse.videoDimensionsX = +dimensions[1];
      modifiedResponse.videoDimensionsY = +dimensions[0];
    }

    for (const category of labelCategories) {
      const categoryResponse: AnnotationResult = {categoryName: category.name, labels: []};
      for (const label of category.labels) {
        const labelResult: LabelResult = {labelName: label.name, segments: []};
        // @ts-ignore
        const segments: Segment[] = await this.segmentsService.getSegments(label._id.toHexString());
        for (const segment of segments) {
          const segmentResult: SegmentResult = {start: segment.start, end: segment.end, trackable: category.isTrackable};
          if (category.isTrackable)
            segmentResult.trackers = await this.markerService.fetchTrackerResults(segment.id.toHexString(), modifiedResponse.videoDimensionsX, modifiedResponse.videoDimensionsY);
          labelResult.segments.push(segmentResult);
        }
        categoryResponse.labels.push(labelResult);
      }
      modifiedResponse.annotations.push(categoryResponse);
    }
    return JSON.stringify(modifiedResponse, null, 4);
  }

  @Post('recommendations/:projectId')
  @UseGuards(AuthGuard())
  async fetchRecommendations(@Param('projectId') id, @Req() req, @Body() body) {
    const systemUser = await this.userService.findByUsername(config.systemUserName);
    if (!systemUser || systemUser.length === 0) {
      await this.userService.create(new UserModel(config.systemUserName, config.systemUserEmail, config.systemUserPwd));
    }
    const project = await this.projectService.findOne(id);
    if (project.singleMedia && project.recommendStatus === 0) {
      // @ts-ignore
      const poll_Id: string = await this.recommendationService.fetchYoloRecommendations(project, config.videoserviceUrl);
      this.logger.log('Created poll for Project ' + project.title + ' - ID # ' + poll_Id);
      if (poll_Id) {
        project.recommendStatus = 1;
        project.recommendPollId = poll_Id.toString();
        await this.projectService.update(project.id.toHexString(), project);
        return { status: 1, message: 'Recommendation Initiated', pollId: poll_Id};
      } else {
        project.recommendStatus = 0;
        project.recommendPollId = '';
        await this.projectService.update(project.id.toHexString(), project);
        return { status: 0, message: 'Recommendation Failed', pollId: ''};
      }
    }
    else if (project.recommendStatus) {
      const poll: Pollingstatus = await this.getPollStatus(project.recommendPollId.toString());
      project.recommendStatus = poll.completed ? 2 : 1;
      await this.projectService.update(project.id.toHexString(), project);
      return { status: project.recommendStatus, message: poll.completed ? 'Recommendation Complete' : 'Recommendation In Progress', pollId: poll.id.toString()};
    }
    return { status: -1, message: 'Not a single media project', pollId: ''};
  }

  @Post('recommendations/recreate/:projectId')
  @UseGuards(AuthGuard())
  async recreateRecommendations(@Param('projectId') id, @Req() req, @Body() body) {
    const project = await this.projectService.findOne(id);
    if (await this.removeYoloRecommendations(project)) {
      await this.labelsGateway.triggerReload(project.id.toString(), 'Recommendation has been re-initiated');
      const poll_Id: string = project.recommendPollId;
      await this.recommendationService.removePoll(poll_Id);
      project.recommendPollId = '';
      project.recommendStatus = 0;
      await this.projectService.update(project.id.toHexString(), project);
      return await this.fetchRecommendations(id, req, body);
    }
    return { status: -1, message: 'Failed to delete recommendations', pollId: ''};
  }

  @Get('poll/:id')
  @UseGuards(AuthGuard())
  async getPollStatus(@Param('id') id) {
    return await this.recommendationService.fetchPollStatus(id);
  }

  async removeYoloRecommendations(project: Project): Promise<boolean> {
    const systemUser: User[] = await this.userService.findByUsername(config.systemUserName);
    const categories: LabelCategory[] = await this.labelsService.getLabelCategoriesByAuthor(project.id.toString(), systemUser[0].id.toString());
    if (categories) {
      for (const category of categories) {
        this.labelsService.deleteLabelCategory(category.id.toString()).then(result => {});
      }
    }
    return true;
  }

  async removeVideoFiles(projectId: any) {
    const project: Project = await this.projectService.findOne(projectId);
    for (const index in project.fileTree.children) {
      if (project.fileTree.children.hasOwnProperty(index)) {
        const path = `${config.multerDest}/${project.fileTree.children[index].filename}`;
        // tslint:disable-next-line:only-arrow-functions
        await fs.unlink(path, function(error){
          // console.log(error);
          console.log('Successfully deleted: ' + path);
        });
      }
    }
  }
}
