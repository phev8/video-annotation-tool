import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectID } from 'mongodb';

@Entity()
export class Pollingstatus {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    completed: boolean;

    @Column()
    error: boolean;

    @Column()
    errorMessage: string;

    constructor(completed: boolean) {
        this.completed = completed;
        this.error = false;
        this.errorMessage = '';
    }
}
