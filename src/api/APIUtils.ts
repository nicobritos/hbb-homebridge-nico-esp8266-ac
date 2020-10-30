import axios, {AxiosResponse} from 'axios';

export abstract class APIUtils {
    static URL: string;

    static get<T>(): Promise<AxiosResponse<T>> {
        return axios.get(APIUtils.URL);
    }

    static post<T>(payload: Record<string, unknown>): Promise<AxiosResponse<T>> {
        return axios.post(
            APIUtils.URL,
            payload,
            {
                headers: {
                    'content-type': 'application/json'
                }
            }
        );
    }
}
