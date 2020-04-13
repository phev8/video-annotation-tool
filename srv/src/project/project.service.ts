import {HttpService, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { FindOneOptions, MongoRepository } from 'typeorm';
import { ObjectID } from 'mongodb';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {PollerService} from "../labels/trackers/poller.service";
import {LabelsGateway} from "../labels/labels.gateway";

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: MongoRepository<Project>,
    private pollerService: PollerService,
    private httpService: HttpService,
    private labelsGateways: LabelsGateway) {
  }

  async findAll(userId: string): Promise<Project[]> {
     const y = ObjectID.createFromHexString(userId);
    const allProjects = await this.projectRepository.find();
     return allProjects.filter(x => {
       return x.ownerId.id.equals(y) || x.contributorIds.find((value) => value.id == y) != null || x.supervisorIds.find((value) => value.id == y) != null;
     });
    //return allProjects;
  }

  async create(project: Project) {
    return await this.projectRepository.insertOne(project);
  }

  async findOne(id: string, fields?: Array<keyof Project>) {
    const options: FindOneOptions = { select: fields };
    return await this.projectRepository.findOne(id, options);
  }

  async update(id: string, project: QueryDeepPartialEntity<Project>) {
    return await this.projectRepository.update(id, project);
  }

  async delete(id: string) {
    return await this.projectRepository.delete(id).then( result => { console.log("Deleted Project: id = " + id )});
  }

  private predictionError(err, pollerId: string) {
    this.pollerService.updatePoll(pollerId, {completed: true, error: true, errorMessage: err}).then(result => {
      console.log(result)
    }, err => {
      console.log(err);
    });
  }
}
