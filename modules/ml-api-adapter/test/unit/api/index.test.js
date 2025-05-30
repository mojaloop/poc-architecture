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


*****/

'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Logger = require('@mojaloop/central-services-logger')
const Config = require('../../../src/lib/config')
const Routes = require('../../../src/api/routes')
const Setup = require('../../../src/shared/setup')

Test('Api index', indexTest => {
  let sandbox

  indexTest.beforeEach(test => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Setup)
    sandbox.stub(Logger)
    test.end()
  })

  indexTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  indexTest.test('export should', exportTest => {
    exportTest.test('initialize server', async function (test) {
      const server = {
        start: sandbox.stub(),
        info: {
          uri: ''
        }
      }
      server.start.returns(Promise.resolve({}))
      Setup.initialize.returns(Promise.resolve(server))

      await require('../../../src/api/index')
      test.ok(Setup.initialize.calledWith({
        service: 'api',
        port: Config.PORT,
        modules: [Routes],
        runHandlers: true
      }))
      test.end()
    })
    exportTest.end()
  })

  indexTest.end()
})
