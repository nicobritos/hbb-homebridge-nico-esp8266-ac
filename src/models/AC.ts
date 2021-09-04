export enum ACSpeed {
    AUTO = 0,
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
}

export enum ACMode {
    OFF = 'off',
    COLD = 'cool',
    HOT = 'hot'
}

export class AC {
    private _mode: ACMode = ACMode.OFF;
    private _temperature: number = 22;

    public get mode(): ACMode {
        return this._mode;
    }

    public set mode(value: ACMode) {
        this._mode = value;
    }

    public get temperature(): number {
        return this._temperature;
    }

    public set temperature(value: number) {
        this._temperature = value;
    }
}
