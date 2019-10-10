import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { FindOneOptions, MongoRepository } from 'typeorm';
import { ObjectID } from 'mongodb';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: MongoRepository<Project>) {
  }

  async findAll(userId: string): Promise<Project[]> {
     const y = ObjectID.createFromHexString(userId);
    const allProjects = await this.projectRepository.find();
     return allProjects.filter(x => {
       return x.ownerId.equals(y) || x.memberIds.find(value => y.equals(value));
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
    return await this.projectRepository.delete(id);
  }
}
