/*    Copyright 2016-2025 Firewalla Inc.
 *
 *    ;This program is free software: you can redistribute it and/or  modify
 *    it under the terms of the GNU Affero General Public License, version 3,
 *    as published by the Free Software Foundation.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */




const { expect, assert } = require('chai');
const { set } = require('lodash');
let mock;
let sensorInstance;

function setupMocks() {
  mock = require('mock-require');
  mock('../net2/logger.js', () => ({
    info: () => {},
    warn: () => {},
    error: () => {}
  }));
  
  mock('../sensor/Sensor.js', {
    Sensor: class {}
  });
  
  mock('../sensor/SensorEventManager.js', {
    getInstance: () => ({
      on: () => {},
      emit: () => {}
    })
  });
  
  mock('../net2/MessageBus.js', class {
    constructor() {}
    subscribe() {}
    publish() {}
  });
  
  mock('../net2/config.js', { get: () => {} });
  mock('../net2/HostManager.js', class {});
  mock('../net2/SysManager.js', {});
  mock('../net2/NetworkProfileManager.js', {});
  mock('../alarm/Alarm.js', {});
  mock('../alarm/AlarmManager2.js', class {});
  mock('../alarm/PolicyManager2.js', class {
    constructor() {}
  });
  mock('../util/util.js', {
    getPreferredBName: () => '',
    delay: async () => {}
  });
  
  mock('../net2/TagManager.js', {});
  mock('../net2/HostTool.js', class {});

  const NewDeviceTagSensor = require('../sensor/NewDeviceTagSensor');
  sensorInstance = new NewDeviceTagSensor({});
}

function restoreMocks() {
  mock.stopAll();
  for (const id of Object.keys(require.cache)) {
    if (id.includes('/net2/') || id.includes('/sensor/') || id.includes('/alarm/') || id.includes('/util/')) {
      delete require.cache[id];
    }
  }
}



describe('NewDeviceTagSensor.isFirewallaAP', () => {
  const mockMode = process.env.MOCK_MODE === 'true';

  before(function() {
    this.timeout(60000);
    if (mockMode) {
      setupMocks();
    }
    const NewDeviceTagSensor = require('../sensor/NewDeviceTagSensor');
    sensorInstance = new NewDeviceTagSensor({});

  });

  after(function() {
    if (mockMode) {
      restoreMocks();
    }
  });

  it('should return true for Firewalla AP MAC address "20:6D:31:6"', () => {
    const host = {
      o: {
        mac: '20:6D:31:61:CC:CC',
        dhcpName: 'notfirewalla'
      }
    }
    const result = sensorInstance.isFirewallaAP(host);
    assert.equal(result, true);
  });

  it('should return true for Firewalla Ceiling AP MAC address, perfix "20:6D:31:7" ', () => {
    const host = {
      o: {
        mac: '20:6D:31:71:CC:CC',
        dhcpName: 'notfirewalla'
      }
    }
    const result = sensorInstance.isFirewallaAP(host);
    assert.equal(result, true);
  });

  it('should return false for non-Firewalla MAC address', () => {
    const host = {
      o: {
        mac: '00:11:22:33:44:55',
        dhcpName: 'notfirewalla'
      }
    }
    const result = sensorInstance.isFirewallaAP(host);
    assert.equal(result, false);
  });

});