import axios, {AxiosResponse} from 'axios';

export abstract class APIUtils {
    static URL: string;
    static previousResult: AxiosResponse | null = null;

    static async get<T>(): Promise<AxiosResponse<T>> {
        if (this.previousResult) return this.previousResult;

        this.previousResult = await axios.get(APIUtils.URL);
        setTimeout(args => {
            APIUtils.previousResult = null;
        }, 5000);
        return this.previousResult!;
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
