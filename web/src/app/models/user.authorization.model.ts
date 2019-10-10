

export class UserAuthModel {

  constructor(
    public username: string,
    public password: string,
    public rememberMe?: boolean
  ) {
  }
}
