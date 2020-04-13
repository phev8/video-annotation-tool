import { Project } from './src/entities/project.entity';
import { User } from './src/entities/user.entity';
import { Label } from './src/entities/label.entity';
import { Segment } from './src/entities/segment.entity';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LabelCategory } from './src/entities/labelcategory.entity';
import { Marker } from './src/entities/markers.entity';
import { Tracker } from './src/entities/tracker.entity';
import {Pollingstatus} from "./src/entities/pollingstatus.entity";

const env = process.env;

const expressPort: number = env.EXPRESS_PORT ? Number(env.EXPRESS_PORT) : 3000;
const origins: string = env.CORS ? env.CORS : 'http://localhost:4200';
const multerDest: string = env.MULTER_DEST ? env.MULTER_DEST : 'uploads';
const trackerUrl: string = 'http://localhost:5000';

const databaseHost: string = env.DB_HOST ? env.DB_HOST : 'localhost';
const databasePort: number = env.DB_PORT ? Number(env.DB_PORT) : 27017;
const databaseUsername: string = env.DB_USERNAME ? env.DB_USERNAME : '';
const databasePassword: string = env.DB_PASSWORD ? env.DB_PASSWORD : '';
const databaseName: string = env.DB_NAME ? env.DB_NAME : 'satdb';

const ormConfig: TypeOrmModuleOptions | MongoConnectionOptions = {
  type: 'mongodb',
  host: databaseHost,
  port: databasePort,
  database: databaseName,
  username: databaseUsername,
  password: databasePassword,
  synchronize: true,
  logging: true,
  entities: [ Project, User, Label, Segment, LabelCategory, Marker, Tracker, Pollingstatus ],
  keepConnectionAlive: true,
};

export const config = {
  expressPort,
  origins,
  multerDest,
  apiKeyExpiresIn: 8 * 60 * 60,
  typeOrmConfig: ormConfig,
  trackerUrl,
  systemColor: "#09a3b6"
};
