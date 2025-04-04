/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Shashikant Hirugade <shashikant.hirugade@modusbox.com>
*****/

'use strict'

const src = '../../../src/'
const Test = require('tapes')(require('tape'))
const Util = require('@mojaloop/central-services-shared').Util
const Default = require('../../../config/default.json')
const Proxyquire = require('proxyquire')

Test('Config tests', configTest => {
  let sandbox
  const Sinon = require('sinon')

  configTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    t.end()
  })

  configTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  configTest.test('getFileContent should', async getFileContentTest => {
    getFileContentTest.test('should not throw', test => {
      try {
        const DefaultStub = Util.clone(Default)
        DefaultStub.ENDPOINT_SECURITY.JWS.JWS_SIGN = true
        const Config = Proxyquire(`${src}/lib/config`, {
          '../../config/default.json': DefaultStub
        })
        test.ok(Config)
        test.ok('pass')
      } catch (e) {
        test.fail('should throw')
      }

      test.end()
    })

    getFileContentTest.test('throw error when file not found', test => {
      try {
        const DefaultStub = Util.clone(Default)
        DefaultStub.ENDPOINT_SECURITY.JWS.JWS_SIGN = true
        DefaultStub.ENDPOINT_SECURITY.JWS.JWS_SIGNING_KEY_PATH = '/fake/path'
        const Config = Proxyquire(`${src}/lib/config`, {
          '../../config/default.json': DefaultStub
        })
        test.fail(Config)
        test.fail('should throw')
      } catch (e) {
        test.ok(e, 'File /fake/path doesn\'t exist, can\'t enable JWS signing')
      }

      test.end()
    })

    getFileContentTest.end()
  })

  configTest.end()
})
