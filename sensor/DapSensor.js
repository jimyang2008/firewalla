/*    Copyright 2016-2025 Firewalla Inc.
 *
 *    This program is free software: you can redistribute it and/or  modify
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

'use strict';

const log = require('../net2/logger.js')(__filename);
const Sensor = require('./Sensor.js').Sensor;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const f = require('../net2/Firewalla.js');
const PlatformLoader = require('../platform/PlatformLoader.js');
const platform = PlatformLoader.getPlatform();
const fsp = require('fs').promises;
const { fileExist, fileRemove } = require('../util/util.js');

class DapSensor extends Sensor {
  constructor(config) {
    super(config);
    this.featureName = 'purpose_dap';
  }

  async run() {
    log.info('DapSensor is launched');
    this.hookFeature(this.featureName);
  }

  async globalOn(featureName) {
    log.info(`Enabling DAP feature: ${featureName}`);
    try {
      // Copy the assets list to extra assets directory
      const extraAssetsDir = f.getExtraAssetsDir();
      await fsp.copyFile(`${platform.getPlatformFilesPath()}/02_assets_dap.lst`, `${extraAssetsDir}/02_assets_dap.lst`);
      
      // Update assets if dap binary doesn't exist
      if (!await fileExist(`${f.getRuntimeInfoFolder()}/assets/dap`)) {
        log.info('DAP binary not found, updating assets...');
        await execAsync(`ASSETSD_PATH=${extraAssetsDir} ${f.getFirewallaHome()}/scripts/update_assets.sh`).catch((err) => {
          log.error(`Failed to invoke update_assets.sh`, err.message);
        });
      }
      
      // Start the fwdap.service
      log.info('Starting fwdap.service...');
      const { stdout, stderr } = await execAsync('sudo systemctl start fwdap.service');
      if (stderr) {
        log.warn('Warning when starting fwdap.service:', stderr);
      }
      log.info('fwdap.service started successfully');
      
    } catch (error) {
      log.error('Failed to enable DAP feature:', error.message);
      throw error;
    }
  }

  async globalOff(featureName) {
    log.info(`Disabling DAP feature: ${featureName}`);
    try {
      // Stop the fwdap.service
      log.info('Stopping fwdap.service...');
      const { stdout, stderr } = await execAsync('sudo systemctl stop fwdap.service');
      if (stderr) {
        log.warn('Warning when stopping fwdap.service:', stderr);
      }
      log.info('fwdap.service stopped successfully');
      
      // Remove the assets list file
      const assetsLstPath = `${f.getExtraAssetsDir()}/02_assets_dap.lst`;
      if (await fileExist(assetsLstPath)) {
        await fileRemove(assetsLstPath);
        log.info('Removed DAP assets list file');
      }
      
    } catch (error) {
      log.error('Failed to disable DAP feature:', error.message);
      throw error;
    }
  }

  async job() {
    // Periodic job that runs when the feature is enabled
    // This can be used for:
    // - Checking device security status
    // - Applying automatic security measures
    // - Logging security events
    log.debug('DapSensor job running');
  }
}

module.exports = DapSensor; 