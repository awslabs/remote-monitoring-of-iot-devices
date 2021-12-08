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
const Engine = require('./lib/engine');
const Logger = require('./lib/logger');
const config = require('./lib/config');
const device = require('./lib/device');
const { Endpoint } = require('aws-sdk');

config.loadConstConfigValues().then(
    async (configValues) => {
        config.logger = new Logger(configValues.loggingLevel);
        config.simulatorLoopInterval = configValues.simulatorLoopInterval;
        config.iotRegion = configValues.iotRegion;
        config.topic = configValues.topic;
        config.device = await device.getDevice(configValues.iotRegion, configValues.simulatorLoopInterval);
        config.logger.log(`Device got id. Device ID: ${config.device.deviceId}`, config.logger.levels.INFO);
        
        await config.getIotEndpoint(configValues.iotRegion).then(
            async (endpoint) => {
                config.logger.log(`IoT Endpoint configured for the target region: ${configValues.iotRegion}: ${endpoint}`, config.logger.levels.INFO);
                config.iotEndpoint = endpoint;

                let engine = new Engine(config);
                engine.start();      
            }
        ).catch(
            (err) => {
                config.logger.log(`Error obtaining IoT Endpoint. Error: ${err}`, config.logger.levels.ROBUST);
                config.logger.error(err, config.logger.levels.ROBUST);
            }
        );
    }
).catch(
    (err) => {
        config.logger.log(`Error starting the engine. Error: ${err}`, config.logger.levels.ROBUST);
        config.logger.error(err, config.logger.levels.ROBUST);
    }
);
