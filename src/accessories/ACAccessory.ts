import {
    AccessoryConfig,
    API,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    HAP,
    Logging,
    Service,
} from 'homebridge';
import {AC, ACMode} from '../models/AC';
import {AcAPI} from '../api/AcAPI';
import {AccessoryPlugin} from 'homebridge/lib/api';
import {APIUtils} from '../api/APIUtils';

interface ACConfiguration extends AccessoryConfig {
    url: string | undefined
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ACAccessory implements AccessoryPlugin {
    private informationService: Service;
    private service: Service;
    private ac: AC = new AC();
    private log: Logging;
    private hap: HAP;
    private config: ACConfiguration;

    constructor(log: Logging, config: AccessoryConfig, api: API) {
        this.log = log;
        this.hap = api.hap;
        this.config = config as ACConfiguration;

        if (!this.config.url) {
            throw new Error("URL not supplied");
        }

        APIUtils.URL = this.config.url;

        this.service = new this.hap.Service.Thermostat(config.name);

        // register handlers
        this.service.getCharacteristic(this.hap.Characteristic.CurrentHeatingCoolingState)
            .on(CharacteristicEventTypes.GET, this.getMode.bind(this));
        this.service.getCharacteristic(this.hap.Characteristic.TargetHeatingCoolingState)
            .on(CharacteristicEventTypes.SET, this.setMode.bind(this))
            .on(CharacteristicEventTypes.GET, this.getMode.bind(this));
        this.service.getCharacteristic(this.hap.Characteristic.CurrentTemperature)
            .on(CharacteristicEventTypes.GET, this.getTemperature.bind(this));
        this.service.getCharacteristic(this.hap.Characteristic.TargetTemperature)
            .on(CharacteristicEventTypes.SET, this.setTemperature.bind(this))
            .on(CharacteristicEventTypes.GET, this.getTemperature.bind(this));
        this.service.getCharacteristic(this.hap.Characteristic.TemperatureDisplayUnits)
            .on(CharacteristicEventTypes.SET, this.setTemperatureDisplayUnits.bind(this))
            .on(CharacteristicEventTypes.GET, this.getTemperatureDisplayUnits.bind(this));

        // set accessory information
        this.informationService = new this.hap.Service.AccessoryInformation()
            .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Nico')
            .setCharacteristic(this.hap.Characteristic.Model, 'ESP8266')
            .setCharacteristic(this.hap.Characteristic.SerialNumber, 'Nico-AC');
    }

    public getServices(): Service[] {
        return [
            this.informationService,
            this.service
        ];
    }

    /**
     * Handle "SET" requests from HomeKit
     */
    private async setMode(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        // implement your own code to turn your device on/off
        this.log.debug('Mode set to: ' + value);
        this.ac.mode = this.translateFromHomekit(value as number);

        try {
            let response = await AcAPI.setMode(this.ac.mode);
            if (response.data.status != 0) {
                this.log.error("Error setting ac status: Status is not zero: " + response.data.status);
                callback(new Error("Status is not zero"));
            } else {
                callback(null, this.translateToHomekit(this.ac.mode));
            }
        } catch (e) {
            this.log.error("Error setting ac status: " + e);
            callback(e);
        }
    }

    /**
     * Handle the "GET" requests from HomeKit
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * @example
     * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
     */
    private getMode(callback: CharacteristicGetCallback) {
        this.refreshState();

        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, this.translateToHomekit(this.ac.mode));
    }

    /**
     * Handle the "GET" requests from HomeKit
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * @example
     * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
     */
    private getTemperature(callback: CharacteristicGetCallback) {
        this.refreshState();

        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, this.ac.temperature);
    }

    /**
     * Handle "SET" requests from HomeKit
     */
    private async setTemperature(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        // implement your own code to turn your device on/off
        this.log.debug('Temperature set to: ' + value);
        this.ac.temperature = value as number;

        try {
            let response = await AcAPI.setTemperature(this.ac.temperature);
            if (response.data.status != 0) {
                this.log.error("Error setting ac temperature: Status is not zero: " + response.data.status);
                callback(new Error("Status is not zero"));
            } else {
                callback(null, this.ac.temperature);
            }
        } catch (e) {
            this.log.error("Error setting ac temperature: " + e);
            callback(e);
        }
    }

    /**
     * Handle the "GET" requests from HomeKit
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * @example
     * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
     */
    private getTemperatureDisplayUnits(callback: CharacteristicGetCallback) {
        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, this.hap.Characteristic.TemperatureDisplayUnits.CELSIUS);
    }

    /**
     * Handle the "GET" requests from HomeKit
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * @example
     * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
     */
    private setTemperatureDisplayUnits(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, this.hap.Characteristic.TemperatureDisplayUnits.CELSIUS);
    }

    /**
     * This function refreshes the device's state async
     * @private
     */
    private refreshState(): void {
        AcAPI.getState()
            .then(value => {
                this.ac.mode = value.data.targetMode;
                this.ac.temperature = typeof value.data.targetTemperature === 'string'
                    ? Number.parseInt(value.data.targetTemperature)
                    : value.data.targetTemperature;

                this.service.updateCharacteristic(
                    this.hap.Characteristic.CurrentHeatingCoolingState,
                    this.translateToHomekit(this.ac.mode)
                );
                this.service.updateCharacteristic(
                    this.hap.Characteristic.TargetHeatingCoolingState,
                    this.translateToHomekit(this.ac.mode)
                );

                this.service.updateCharacteristic(this.hap.Characteristic.CurrentTemperature, this.ac.temperature);
                this.service.updateCharacteristic(this.hap.Characteristic.TargetTemperature, this.ac.temperature);
            })
            .catch(reason => {
                this.log.error("Error getting state for light bulb: " + reason);
            });
    }

    private translateToHomekit(mode: ACMode): number {
        if (mode === ACMode.OFF) return this.hap.Characteristic.TargetHeatingCoolingState.OFF;
        if (mode === ACMode.HOT) return this.hap.Characteristic.TargetHeatingCoolingState.HEAT;
        return this.hap.Characteristic.TargetHeatingCoolingState.COOL;
    }

    private translateFromHomekit(mode: number): ACMode {
        if (mode === this.hap.Characteristic.TargetHeatingCoolingState.OFF) return ACMode.OFF;
        if (mode === this.hap.Characteristic.TargetHeatingCoolingState.HEAT) return ACMode.HOT;
        return ACMode.COLD;
    }
}
