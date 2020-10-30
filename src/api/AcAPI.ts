import {APIUtils} from './APIUtils';
import {AxiosResponse} from 'axios';
import {ACMode, ACSpeed} from '../models/AC';

interface ACOptions {
    "targetMode": ACMode,
    "targetFanSpeed": ACSpeed,
    "targetTemperature": number | string,
    "verticalSwing": boolean,
    "sleepMode": boolean,
    "dryMode": boolean
}

/**
 * status is zero if the request was executed successfully
 */
interface PostResponse {
    "status": number | string
}

export abstract class AcAPI {
    static getState(): Promise<AxiosResponse<ACOptions>> {
        return APIUtils.get();
    }

    static setMode(mode: ACMode): Promise<AxiosResponse<PostResponse>> {
        return APIUtils.post(
            {
                targetMode: mode
            } as Partial<ACOptions>
        );
    }

    static setTemperature(temperature: number): Promise<AxiosResponse<PostResponse>> {
        return APIUtils.post(
            {
                targetTemperature: temperature
            } as Partial<ACOptions>
        );
    }
}
