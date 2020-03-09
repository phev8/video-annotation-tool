import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Pollingstatus} from "../../entities/pollingstatus.entity";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";

@Injectable()
export class PollerService {
    constructor(@InjectRepository(Pollingstatus)
                private readonly pollingRepository: MongoRepository<Pollingstatus>) {
    }

    createPoll(completed: boolean) {
        const polling_status = new Pollingstatus(completed);
        return this.pollingRepository.insert(polling_status);
    }

    async findPoll(id: string) {
        return await this.pollingRepository.findOne(id);
    }

    async updatePoll(id: string, poll: any) {
        const polling = await this.pollingRepository.findOne(id);
        if(polling) {
            polling.errorMessage = poll.errorMessage;
            polling.error = poll.error;
            polling.completed = poll.completed;
            return await this.pollingRepository.save(polling);
        }
        //return await this.pollingRepository.update(id, poll);
    }

}