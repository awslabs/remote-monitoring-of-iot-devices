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
const {promisify} = require('util');

module.exports = {
    getDevice : async function(targetRegion, loopInterval){

        // save DeviceId to use same ID on restart
        const _saveDeviceId = async function (targetRegion, id, ttlDevice){
            const ddb = new AWS.DynamoDB.DocumentClient({region: targetRegion});        
            let ttlNow = Math.round(Date.now() / 1000);

            let params = {
                TableName: "iot-rm-devices-table",
                Item: {
                    deviceId: id,
                    ttlDevice: ttlDevice
                },
                ConditionExpression: "attribute_not_exists(deviceId) OR ttlDevice <= :ttl",
                ExpressionAttributeValues: {
                    ":ttl": ttlNow
                }
            }
        
            const putAsync = promisify(ddb.put).bind(ddb);
            
            try
            {
                await putAsync(params);
                return true;
            }
            catch (err)
            {
                return false;        
            }
        }

        var gotId = false;
        var id = 1000;
        var ttlDevice = 0;
    
        while (!gotId)
        {
            //Assuming 4 times the loop interval enough
            ttlDevice = Math.round(Date.now() / 1000) + (loopInterval / 1000 * 4);
            
            if (await _saveDeviceId(targetRegion, id, ttlDevice))
            {
                gotId = true;
                break;
            }
            else
            {
                console.log(`getDevice :: try to get id ${id}`);
            }
            
            id++;
        }
        
        return {
            deviceId: id,
            ttlDevice: ttlDevice
        };
    },
    refreshDevice: async function(targetRegion, loopInterval, device){

        const _updateDevice = async function (targetRegion, device, newttlDevice){
            const ddb = new AWS.DynamoDB.DocumentClient({region: targetRegion});        
            
            let params = {
                TableName: "iot-rm-devices-table",
                Key: {
                    deviceId: device.deviceId
                },
                UpdateExpression: "set ttlDevice = :nt",
                ExpressionAttributeValues: {
                    ":nt": newttlDevice,
                    ":t": device.ttlDevice
                },
                ConditionExpression: "ttlDevice = :t"
            }
        
            const updateAsync = promisify(ddb.update).bind(ddb);
            
            await updateAsync(params);
        }
        
        //Assuming 4 times the loop interval enough
        var newttlDevice = Math.round(Date.now() / 1000) + (loopInterval / 1000 * 4);
        await _updateDevice(targetRegion, device, newttlDevice);

        device.ttlDevice = newttlDevice;
        
        return device;
    }
}