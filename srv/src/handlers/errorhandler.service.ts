import {Injectable} from "@nestjs/common";
import {ErrorModel} from "./error.model";

@Injectable()
export class ErrorhandlerService {
    constructor() {
    }

    private static handleError(error, metaInfo?: string) {
        console.log(new ErrorModel(error.code, error.message, metaInfo).toString());
    }
}