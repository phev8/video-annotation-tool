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
        const errorMessage = poll.errorMessage? poll.errorMessage.message? poll.errorMessage.message: poll.errorMessage: "";
        const polling = await this.pollingRepository.findOne(id);
        if(polling) {
            await this.pollingRepository.update(polling.id.toString(), {completed: true});
            if(errorMessage && errorMessage!= "") {
                console.log("POLL STATUS UPDATE ==" + "id: " + id + "; completed: "+ true+ "; error: "+ true+ "; errorMessage: "+ errorMessage);
                await this.pollingRepository.update(polling.id.toString(), {errorMessage: errorMessage});
                return await this.pollingRepository.update(polling.id.toString(), {error: true});
            }
            console.log("POLL STATUS UPDATE ==" + "id: " + id + "; completed: "+ true+ "; error: "+ false);
        }
    }

}