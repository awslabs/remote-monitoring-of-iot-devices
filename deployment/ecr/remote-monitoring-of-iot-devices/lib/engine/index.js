/*********************************************************************************************************************
 *  Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/


/**
 * @author Solution Builders
 */

'use strict';

const AWS = require('aws-sdk');
const device = require('../device');

class Engine {
    
    constructor(options) {
        this.options = options;

        this.iotdata = new AWS.IotData({
            endpoint: options.iotEndpoint,
            region: options.iotRegion
        });

    }

    start() {
        let _self = this;

        _self.options.logger.log("Starting RM Device Simulator...", _self.options.logger.levels.INFO);

        this.pollerInterval = setInterval(function () {
            _self.doWork();
        }, this.options.simulatorLoopInterval);
    }

    doWork(){
        let _self = this;
        
        // Range for engine pressure 
        let pressureLower = 0.0;
        let pressureUpper = 100.0;

        // Range for oil level 
        let oilLevelLower = 1.0;
        let oilLeverUpper = 100.0;
        
        // Range for temperarure        
        let temperatureLower = 175;
        let temperatureUpper = 250;

        let pressure = Math.floor(Math.random() * (pressureUpper - pressureLower)) + pressureLower;
        let oilLevel = Math.floor(Math.random() * (oilLeverUpper - oilLevelLower)) + oilLeverUpper;
        let temperature = Math.floor(Math.random() * (temperatureUpper - temperatureLower)) + temperatureLower;

        // payload
        let payload = JSON.stringify({
            deviceType: "RM_Accelerator",
            deviceId: _self.options.device.deviceId,
            pressure: pressure,
            oilLevel: oilLevel,
            temperature: temperature
        });

        //publish payload
        _self._publishMessage("remote_monitoring/", payload).then((result) => {
            _self.options.logger.debug(`Message successfully sent to configured topic.`, _self.options.logger.levels.DEBUG);
        }).catch((err) => {
            _self.options.logger.error(err, this.options.logger.levels.ROBUST);
            _self.options.logger.debug(`Error occurred while attempting to send message to configured topic.`, _self.options.logger.levels.DEBUG);
        });

        device.refreshDevice(
            _self.options.iotRegion, 
            _self.options.simulatorLoopInterval, 
            _self.options.device
        ).then((deviceUpdated) => {
            _self.options.device = deviceUpdated;
            _self.options.logger.debug(`Device TTL updated. Device ID: ${_self.options.device.deviceId}`, _self.options.logger.levels.DEBUG);
        }).catch((err) => {
            _self.options.logger.error(err, this.options.logger.levels.ROBUST);
            _self.options.logger.debug(`Error occurred while attempting to update device ttl.`, _self.options.logger.levels.DEBUG);
        })
    }

    _publishMessage(topic, payload) {
        const _self = this;
        return new Promise((resolve, reject) => {

            var params = {
                topic: topic,
                payload: payload,
                qos: 0
            };

            if (this.options.iotEndpoint === '') {
                _self.options.logger.log('Invalid IoT Endpoint can not publish generated payload to AWS IoT.', _self.options.logger.levels.ROBUST);
                return reject(err);
            }

            this.iotdata.publish(params, function (err, data) {
                if (err) {
                    _self.options.logger.log('Error occurred while attempting to publish generated payload to AWS IoT.', _self.options.logger.levels.ROBUST);
                    _self.options.logger.log(err, _self.options.logger.levels.ROBUST);
                    reject(err);
                } else {
                    resolve(data);
                }
            });

        });
    }

}

module.exports = Engine;