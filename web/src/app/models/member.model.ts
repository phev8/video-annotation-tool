import { UserModel } from './user.model';

export class MemberModel {
  public name: string;
  public status: boolean;
  public members: UserModel[];
  public searchStatus: boolean;
  public emptyMemberStatus: boolean;
  public type: string;

  constructor(name: string, status: boolean, members: UserModel[], searchStatus: boolean, emptyMemberStatus: boolean, type: string) {
    this.name = name;
    this.status = status;
    this.members = members;
    this.searchStatus = searchStatus;
    this.emptyMemberStatus = emptyMemberStatus;
    this.type = type;
  }
}
