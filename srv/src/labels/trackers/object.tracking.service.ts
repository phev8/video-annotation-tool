import {Injectable, HttpService} from "@nestjs/common";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {MarkerService} from "./marker/marker.service";
import {Tracker} from "../../entities/tracker.entity";
import {config} from "../../../config";

@Injectable()
export class ObjectTrackingService {
    constructor(
        private httpService: HttpService,
        private markerService: MarkerService) {
    }

    async trackObjects(tracker: Tracker, videoId: string, dimensions: string[], filename: string, timeList: { requiredTimes: number[]; initialTrackerTime: number }): Promise<Observable<any>> {
        const request = {filename: filename, videoX: dimensions[1], videoY: dimensions[0], trackerType: tracker.trackerType,
            trackerDimensions: MarkerService.getTrackableResult(tracker.trackables, tracker.trackerType), initialTrackerTime: timeList.initialTrackerTime,
            requiredTimes: timeList.requiredTimes
        };
        const url = 'http://localhost:5000/video/tracking';
        return this.httpService.post(url, request);
    }
}