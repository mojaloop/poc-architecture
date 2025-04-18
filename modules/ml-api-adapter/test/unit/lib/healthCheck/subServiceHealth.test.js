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

* Lewis Daly <lewis@vesselstech.com>

* Rajiv Mothilal <rajiv.mothilal@modusbox.com>
*****/

'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const proxyquire = require('proxyquire')
const axios = require('axios')
const Producer = require('@mojaloop-poc/central-services-stream').Util.Producer
const Config = require('../../../../src/lib/config')
const { statusEnum, serviceName } = require('@mojaloop/central-services-shared').HealthCheck.HealthCheckEnums
const Logger = require('@mojaloop/central-services-logger')

const Notification = require('../../../../src/handlers/notification/index')

const {
  getSubServiceHealthBroker
} = require('../../../../src/lib/healthCheck/subServiceHealth')

Test('SubServiceHealth test', subServiceHealthTest => {
  let sandbox

  subServiceHealthTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Notification, 'isConnected')
    sandbox.stub(axios, 'get')

    sandbox.stub(Logger, 'isErrorEnabled').value(true)
    sandbox.stub(Logger, 'isInfoEnabled').value(true)
    sandbox.stub(Logger, 'isDebugEnabled').value(true)
    t.end()
  })

  subServiceHealthTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  subServiceHealthTest.test('getSubServiceHealthBroker', brokerTest => {
    brokerTest.test('broker test fails when one broker cannot connect', async test => {
      // Arrange
      Notification.isConnected.throws(new Error('Not connected!'))
      const expected = { name: serviceName.broker, status: statusEnum.DOWN }

      // Act
      const result = await getSubServiceHealthBroker()

      // Assert
      test.deepEqual(result, expected, 'getSubServiceHealthBroker should match expected result')
      test.end()
    })

    brokerTest.test('Passes when it connects', async test => {
      // Arrange
      Notification.isConnected.returns(Promise.resolve(true))
      const expected = { name: serviceName.broker, status: statusEnum.OK }

      // Act
      const result = await getSubServiceHealthBroker()

      // Assert
      test.deepEqual(result, expected, 'getSubServiceHealthBroker should match expected result')
      test.end()
    })

    brokerTest.test('Fail when isProducerConnected throws an error', async test => {
      // Arrange
      Config.HANDLERS_DISABLED = true
      sandbox.stub(Producer, 'isConnected').throwsException()
      const subServiceHealthProxy = proxyquire('../../../../src/lib/healthCheck/subServiceHealth', {
        Config: Config,
        Producer: Producer
      })
      const expected = { name: serviceName.broker, status: statusEnum.DOWN }
      const result = await subServiceHealthProxy.getSubServiceHealthBroker()
      test.deepEqual(result, expected, 'getSubServiceHealthBroker should match expected result')
      Config.HANDLERS_DISABLED = false
      Producer.isConnected.restore()
      test.end()
    })

    brokerTest.test('Fail when isProducerConnected throws an error', async test => {
      // Arrange
      Config.HANDLERS_DISABLED = true
      sandbox.stub(Producer, 'isConnected').returns(Producer.stateList.DOWN)
      const subServiceHealthProxy = proxyquire('../../../../src/lib/healthCheck/subServiceHealth', {
        Config: Config,
        Producer: Producer
      })
      const expected = { name: serviceName.broker, status: statusEnum.DOWN }
      const result = await subServiceHealthProxy.getSubServiceHealthBroker()
      test.deepEqual(result, expected, 'getSubServiceHealthBroker should match expected result')
      Config.HANDLERS_DISABLED = false
      Producer.isConnected.restore()
      test.end()
    })

    brokerTest.end()
  })

  subServiceHealthTest.test('getSubServiceHealthCentralLedger', centralLedgerTest => {
    centralLedgerTest.test('is down when can\'t connect to the central ledger', async test => {
      // Arrange
      axios.get.throws(new Error('Error connecting to central ledger'))
      const subServiceHealthProxy = proxyquire('../../../../src/lib/healthCheck/subServiceHealth', { axios: axios })

      const expected = { name: 'participantEndpointService', status: statusEnum.DOWN }

      // Act
      const result = await subServiceHealthProxy.getSubServiceHealthCentralLedger()

      // Assert
      test.deepEqual(result, expected, 'getSubServiceHealthCentralLedger should match expected result')
      test.end()
    })

    centralLedgerTest.test('is down when the central ledger is down', async test => {
      // Arrange
      axios.get.resolves({ data: { status: 'DOWN' } })
      const subServiceHealthProxy = proxyquire('../../../../src/lib/healthCheck/subServiceHealth', { axios: axios })

      const expected = { name: 'participantEndpointService', status: statusEnum.DOWN }

      // Act
      const result = await subServiceHealthProxy.getSubServiceHealthCentralLedger()

      // Assert
      test.deepEqual(result, expected, 'getSubServiceHealthCentralLedger should match expected result')
      test.end()
    })

    centralLedgerTest.test('is up when the central ledger is up', async test => {
      // Arrange
      axios.get.resolves({ data: { status: 'OK' } })
      const subServiceHealthProxy = proxyquire('../../../../src/lib/healthCheck/subServiceHealth', { axios: axios })

      const expected = { name: 'participantEndpointService', status: statusEnum.OK }

      // Act
      const result = await subServiceHealthProxy.getSubServiceHealthCentralLedger()

      // Assert
      test.deepEqual(result, expected, 'getSubServiceHealthCentralLedger should match expected result')
      test.end()
    })

    centralLedgerTest.test('handles unknown status from the central ledger', async test => {
      // Arrange
      axios.get.resolves({ status: 12345 })
      const subServiceHealthProxy = proxyquire('../../../../src/lib/healthCheck/subServiceHealth', { axios: axios })

      const expected = { name: 'participantEndpointService', status: statusEnum.DOWN }

      // Act
      const result = await subServiceHealthProxy.getSubServiceHealthCentralLedger()

      // Assert
      test.deepEqual(result, expected, 'getSubServiceHealthCentralLedger should match expected result')
      test.end()
    })

    centralLedgerTest.end()
  })

  subServiceHealthTest.end()
})
