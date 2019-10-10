import { Column, Entity, Index, ObjectID, ObjectIdColumn} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  @Index({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  email: string;
}
