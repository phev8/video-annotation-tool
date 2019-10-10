

export class UserSignupModel {

  constructor(
    public username: string,
    public email: string,
    public password: string,
    public repeatPassword: string,
  ) {
  }
}
