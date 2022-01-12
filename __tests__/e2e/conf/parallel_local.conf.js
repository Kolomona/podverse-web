require('dotenv').config()

const { BROWSERSTACK } = require('../constants')
const globalHooks = require('../hooks')
const timeoutOverride = parseInt(process.env.TEST_TIMEOUT_OVERRIDE) || 15000

const nightwatch_config = {
  src_folders: ['__tests__/e2e/tests'],

  custom_commands_path: './__tests__/e2e/extensions',

  selenium: {
    start_process: false,
    host: 'hub-cloud.browserstack.com',
    port: 80
  },

  common_capabilities: {
    build: 'Web - Local - parallel',
    project: 'podverse-web',
    'browserstack.user': process.env.BROWSERSTACK_USERNAME || 'BROWSERSTACK_USERNAME',
    'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY || 'BROWSERSTACK_ACCESS_KEY',
    'browserstack.debug': true,
    'browserstack.local': true,
    'browserstack.localIdentifier': BROWSERSTACK.BROWSERSTACK_LOCAL_IDENTIFER
  },

  test_settings: {
    default: {
      globals: {
        waitForConditionTimeout: timeoutOverride,
        ...globalHooks
      }
    },
    chrome: {
      desiredCapabilities: {
        browser: 'chrome'
      }
    },
    firefox: {
      desiredCapabilities: {
        browser: 'firefox'
      }
    },
    safari: {
      desiredCapabilities: {
        browser: 'safari'
      }
    }
  }
}

// Code to support common capabilites
for (const i in nightwatch_config.test_settings) {
  const config = nightwatch_config.test_settings[i]
  config['selenium_host'] = nightwatch_config.selenium.host
  config['selenium_port'] = nightwatch_config.selenium.port
  config['desiredCapabilities'] = config['desiredCapabilities'] || {}
  for (const j in nightwatch_config.common_capabilities) {
    config['desiredCapabilities'][j] = config['desiredCapabilities'][j] || nightwatch_config.common_capabilities[j]
  }
}

module.exports = nightwatch_config
