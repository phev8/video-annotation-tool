import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { UserRegistrationDto } from '../dto/user.registration.dto';
import { UserModel } from './user.model';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Project } from '../entities/project.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {
  }

  @Post()
  async create(@Body() userDto: UserRegistrationDto, @Res() res: Response) {
    if (UsersController.isValidUserDto(userDto)) {
      bcrypt.hash(userDto.password, 10, async (err, hash) => {
        if (err) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
        }
        const user = new UserModel(userDto.username, userDto.email, hash);
        await this.usersService.create(user)
          .then(value => {
              if (value.result.n === 1 && value.result.ok === 1) {
                res.status(HttpStatus.OK)
                  .json({ success: true })
                  .send();
              } else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
              }
            },
            reason => {
              if (reason.code === 11000) {
                res.status(HttpStatus.CONFLICT).send();
              } else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
              }
            });
      });
    } else {
      res.status(HttpStatus.BAD_REQUEST).send();
    }
  }

  @Get('')
  @UseGuards(AuthGuard())
  async getUsers(@Req() req: Request): Promise<UserModel[]> {
    return await this.usersService.findUsersByIds(req.headers.ids.toString().split(','));
  }

  private static isValidUserDto(userDto: UserRegistrationDto) {
    if (userDto) {
      if (userDto.username) {
        if (userDto.username.length >= 3 && userDto.username.length <= 26) {
          return true;
        }
      } else {
        return false;
      }

      if (userDto.email) {
        if (userDto.email.split('@').length === 2) {
          return true;
        }
      }

      if (userDto.password) {
        return 9 <= userDto.password.length && userDto.password.length <= 64;
      } else {
        return false;
      }
    }
    return false;
  }
}
