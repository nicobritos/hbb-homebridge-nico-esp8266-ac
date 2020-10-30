import {API, HAP} from 'homebridge';
import {ACAccessory} from './accessories/ACAccessory';

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
    hap = api.hap;
    api.registerAccessory("nico-esp8266-ac", ACAccessory);
};
