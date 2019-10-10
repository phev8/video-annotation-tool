import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.payload';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService) {
  }

  async createToken(username: string, password: string) {
    let user: User = await this.usersService.findOneByUsername(username);
    if (!user) {
      user = await this.usersService.findOneByEmail(username);
    }

    if (user) { // fixme compareSync
      const same: boolean = await bcrypt.compare(password, user.password);
      delete user.password;

      if (same) {
        const payload: JwtPayload = {  // todo: what else there needs to be in the payload?
          id: user.id.toHexString(),
        };
        const accessToken = this.jwtService.sign(payload);
        return {
          accessToken,
          user,
          expiresIn: 5 * 60 * 60,
        };
      }
    }
    return { error: 'Invalid username or password' };
  }

  async validateUser(payload: JwtPayload) {
    const id = payload.id;
    return await this.usersService.findOneById(id);
  }s
}
