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

'use strict'
const AWS = require('aws-sdk');

module.exports = {
    loadConstConfigValues: function() {
        return new Promise((resolve, reject) => {
    
            // loop and publish message every 30 seconds
            const config = {
                loggingLevel: 3,
                simulatorLoopInterval: 30000,
                iotRegion: process.env.AWS_REGION,
                topic: process.env.TOPIC
            };

            resolve(config)
        });
    },
    getIotEndpoint: function (targetRegion) {
        return new Promise((resolve, reject) => {

            let iot = new AWS.Iot({
                region: targetRegion
            });
            let params = {
                endpointType: 'iot:Data-ATS'
            };
            iot.describeEndpoint(params, function (err, data) {
                if (err) {
                    console.log(`Error occurred while attempting to retrieve the AWS IoT endpoint for region ${targetRegion}.`);
                    reject(err)
                } else {
                    resolve(data.endpointAddress);
                }
            });
        });
    }
}