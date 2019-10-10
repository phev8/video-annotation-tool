import { UserModel } from './user.model';

export class SessionModel {
  accessToken: string;
  expiresIn: number;
  user: UserModel;
}
