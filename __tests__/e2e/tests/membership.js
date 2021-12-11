const { WEB_ORIGIN } = require('../constants')

module.exports = {
  before: function (browser) {
    browser.url(`${WEB_ORIGIN}/`)
  },
  'Membership': function (browser) {
    browser
      .click('.react-dropdown-select')
      .click('.react-dropdown-select-item:nth-child(1)')
      .waitForElementWithText('.app-main-wrapper main div p', 'Get 1 year free when you sign up for Podverse premium')
      


  },
  after: function (browser) {
    browser.end()
  }
}
