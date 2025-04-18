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

* Georgi Georgiev <georgi.georgiev@modusbox.com>

* Shashikant Hirugade <shashikant.hirugade@modusbox.com>

* Miguel de Barros <miguel.debarros@modusbox.com>
*****/

'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Uuid = require('uuid4')
const Config = require(`${src}/lib/config`)
const KafkaUtil = require('@mojaloop/central-services-shared').Util.Kafka
const Kafka = require('@mojaloop-poc/central-services-stream').Util
const Request = require('@mojaloop/central-services-shared').Util.Request
const Enum = require('@mojaloop/central-services-shared').Enum
const Fixtures = require('../../../fixtures/index')
const Logger = require('@mojaloop/central-services-logger')

const timeoutAttempts = 10
const callbackWaitSeconds = 2

const getNotificationUrl = process.env.ENDPOINT_URL

Test('Notification Handler', notificationHandlerTest => {
  notificationHandlerTest.test('should', async notificationTest => {
    notificationTest.test('consume a PREPARE message and send POST callback', async test => {
      const transferId = Uuid()
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: Enum.Events.Event.Action.PREPARE,
            action: Enum.Events.Event.Action.PREPARE,
            state: {
              status: 'success',
              code: 0
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-destination': 'dfsp2',
            'fspiop-source': 'dfsp1'
          },
          payload: {
            amount: { amount: 100, currency: 'USD' },
            condition: 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvze1',
            expiration: '2018-08-24T21:31:00.534+01:00',
            ilpPacket: 'AQAAAAAAAABkEGcuZXdwMjEuaWQuODAwMjCCAhd7InRyYW5zYWN0aW9uSWQiOiJmODU0NzdkYi0xMzVkLTRlMDgtYThiNy0xMmIyMmQ4MmMwZDYiLCJxdW90ZUlkIjoiOWU2NGYzMjEtYzMyNC00ZDI0LTg5MmYtYzQ3ZWY0ZThkZTkxIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNTYxMjM0NTYiLCJmc3BJZCI6IjIxIn19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI1NjIwMTAwMDAxIiwiZnNwSWQiOiIyMCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn0sImRhdGVPZkJpcnRoIjoiMTk4My0xMC0yNSJ9fSwiYW1vdW50Ijp7ImFtb3VudCI6IjEwMCIsImN1cnJlbmN5IjoiVVNEIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIifSwibm90ZSI6ImhlaiJ9',
            payeeFsp: 'dfsp1',
            payerFsp: 'dfsp2',
            transferId: transferId
          }
        },
        to: 'dfsp2',
        from: 'dfsp1',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'post'
      let response = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!response && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        response = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(response.payload, messageProtocol.content.payload, 'Notification sent successfully to Payee')
      test.end()
    })

    notificationTest.test('consume a PREPARE message and send PUT callback on error', async test => {
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const transferId = Uuid()
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: 'prepare',
            action: 'prepare',
            state: {
              code: 3100,
              description: 'Generic validation error',
              status: 'error'
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-source': 'switch',
            'fspiop-destination': 'dfsp1'
          },
          uriParams: {
            id: transferId
          },
          payload: {
            errorInformation: {
              errorCode: '3100',
              errorDescription: 'Generic validation error'
            }
          }
        },
        from: 'switch',
        to: 'dfsp1',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'error'
      let response = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!response && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        response = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(response.payload, messageProtocol.content.payload, 'Error notification sent successfully from switch to Payer')
      test.end()
    })

    notificationTest.test('consume a COMMIT message and send PUT callback', async test => {
      const transferId = Uuid()
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: 'commit',
            action: 'commit',
            state: {
              status: 'success',
              code: 0
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-destination': 'dfsp2',
            'fspiop-source': 'dfsp1'
          },
          payload: {
            amount: { amount: 100, currency: 'USD' },
            transferState: 'COMMITTED',
            fulfilment: 'f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA',
            condition: 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvze1',
            expiration: '2018-08-24T21:31:00.534+01:00',
            ilpPacket: 'AQAAAAAAAABkEGcuZXdwMjEuaWQuODAwMjCCAhd7InRyYW5zYWN0aW9uSWQiOiJmODU0NzdkYi0xMzVkLTRlMDgtYThiNy0xMmIyMmQ4MmMwZDYiLCJxdW90ZUlkIjoiOWU2NGYzMjEtYzMyNC00ZDI0LTg5MmYtYzQ3ZWY0ZThkZTkxIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNTYxMjM0NTYiLCJmc3BJZCI6IjIxIn19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI1NjIwMTAwMDAxIiwiZnNwSWQiOiIyMCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn0sImRhdGVPZkJpcnRoIjoiMTk4My0xMC0yNSJ9fSwiYW1vdW50Ijp7ImFtb3VudCI6IjEwMCIsImN1cnJlbmN5IjoiVVNEIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIifSwibm90ZSI6ImhlaiJ9',
            payeeFsp: 'dfsp1',
            payerFsp: 'dfsp2',
            transferId: transferId
          }
        },
        to: 'dfsp2',
        from: 'dfsp1',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'put'
      let responseFrom = await getNotifications(messageProtocol.from, operation, transferId)
      let responseTo = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!(responseTo && responseFrom) && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        responseFrom = await getNotifications(messageProtocol.from, operation, transferId)
        responseTo = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(responseFrom.payload, messageProtocol.content.payload, 'Notification sent successfully to Payer')
      test.deepEqual(responseTo.payload, messageProtocol.content.payload, 'Notification sent successfully to Payee')
      test.end()
    })

    notificationTest.test('consume a COMMIT message and send PUT callback on error', async test => {
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const transferId = Uuid()
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: 'commit',
            action: 'commit',
            state: {
              code: 3000,
              description: 'Generic error',
              status: 'error'
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-source': 'dfsp2',
            'fspiop-destination': 'dfsp1'
          },
          payload: {
            errorInformation: {
              errorCode: '3000',
              errorDescription: 'Generic error'
            }
          },
          uriParams: {
            id: transferId
          }
        },
        from: 'dfsp2',
        to: 'dfsp1',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'error'
      let response = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!response && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        response = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(response.payload, messageProtocol.content.payload, 'Notification sent successfully to Payer')
      test.end()
    })

    notificationTest.test('consume a REJECT message and send PUT callback', async test => {
      const transferId = Uuid()
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: 'reject',
            action: 'reject',
            state: {
              status: 'success',
              code: 0
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-destination': 'dfsp2',
            'fspiop-source': 'dfsp1'
          },
          payload: {
            amount: { amount: 100, currency: 'USD' },
            transferState: 'COMMITTED',
            fulfilment: 'f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA',
            condition: 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvze1',
            expiration: '2018-08-24T21:31:00.534+01:00',
            ilpPacket: 'AQAAAAAAAABkEGcuZXdwMjEuaWQuODAwMjCCAhd7InRyYW5zYWN0aW9uSWQiOiJmODU0NzdkYi0xMzVkLTRlMDgtYThiNy0xMmIyMmQ4MmMwZDYiLCJxdW90ZUlkIjoiOWU2NGYzMjEtYzMyNC00ZDI0LTg5MmYtYzQ3ZWY0ZThkZTkxIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNTYxMjM0NTYiLCJmc3BJZCI6IjIxIn19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI1NjIwMTAwMDAxIiwiZnNwSWQiOiIyMCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn0sImRhdGVPZkJpcnRoIjoiMTk4My0xMC0yNSJ9fSwiYW1vdW50Ijp7ImFtb3VudCI6IjEwMCIsImN1cnJlbmN5IjoiVVNEIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIifSwibm90ZSI6ImhlaiJ9',
            payeeFsp: 'dfsp1',
            payerFsp: 'dfsp2',
            transferId: transferId
          }
        },
        to: 'dfsp2',
        from: 'dfsp1',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'put'
      let responseFrom = await getNotifications(messageProtocol.from, operation, transferId)
      let responseTo = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!(responseTo && responseFrom) && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        responseFrom = await getNotifications(messageProtocol.from, operation, transferId)
        responseTo = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(responseFrom.payload, messageProtocol.content.payload, 'Notification sent successfully to Payer')
      test.deepEqual(responseTo.payload, messageProtocol.content.payload, 'Notification sent successfully to Payee')
      test.end()
    })

    notificationTest.test('consume a ABORT message and send PUT callback', async test => {
      const transferId = Uuid()
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: 'abort',
            action: 'abort',
            state: {
              status: 'success',
              code: 0
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-destination': 'dfsp2',
            'fspiop-source': 'dfsp1'
          },
          payload: {
            amount: { amount: 100, currency: 'USD' },
            transferState: 'COMMITTED',
            fulfilment: 'f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA',
            condition: 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvze1',
            expiration: '2018-08-24T21:31:00.534+01:00',
            ilpPacket: 'AQAAAAAAAABkEGcuZXdwMjEuaWQuODAwMjCCAhd7InRyYW5zYWN0aW9uSWQiOiJmODU0NzdkYi0xMzVkLTRlMDgtYThiNy0xMmIyMmQ4MmMwZDYiLCJxdW90ZUlkIjoiOWU2NGYzMjEtYzMyNC00ZDI0LTg5MmYtYzQ3ZWY0ZThkZTkxIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNTYxMjM0NTYiLCJmc3BJZCI6IjIxIn19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI1NjIwMTAwMDAxIiwiZnNwSWQiOiIyMCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn0sImRhdGVPZkJpcnRoIjoiMTk4My0xMC0yNSJ9fSwiYW1vdW50Ijp7ImFtb3VudCI6IjEwMCIsImN1cnJlbmN5IjoiVVNEIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIifSwibm90ZSI6ImhlaiJ9',
            payeeFsp: 'dfsp1',
            payerFsp: 'dfsp2',
            transferId: transferId
          }
        },
        to: 'dfsp2',
        from: 'dfsp1',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'error'
      let responseFrom = await getNotifications(messageProtocol.from, operation, transferId)
      let responseTo = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!(responseTo && responseFrom) && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        responseFrom = await getNotifications(messageProtocol.from, operation, transferId)
        responseTo = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(responseFrom.payload, messageProtocol.content.payload, 'Notification sent successfully to Payer')
      test.deepEqual(responseTo.payload, messageProtocol.content.payload, 'Notification sent successfully to Payee')
      test.end()
    })

    notificationTest.test('consume a TIMEOUT-RECEIVED message and send PUT callback', async test => {
      const transferId = Uuid()
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: 'prepare',
            action: 'timeout-received',
            state: {
              status: 'success',
              code: 0
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-source': 'dfsp1',
            'fspiop-destination': 'dfsp2'
          },
          payload: {
            amount: { amount: 100, currency: 'USD' },
            transferState: 'COMMITTED',
            fulfilment: 'f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA',
            condition: 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvze1',
            expiration: '2018-08-24T21:31:00.534+01:00',
            ilpPacket: 'AQAAAAAAAABkEGcuZXdwMjEuaWQuODAwMjCCAhd7InRyYW5zYWN0aW9uSWQiOiJmODU0NzdkYi0xMzVkLTRlMDgtYThiNy0xMmIyMmQ4MmMwZDYiLCJxdW90ZUlkIjoiOWU2NGYzMjEtYzMyNC00ZDI0LTg5MmYtYzQ3ZWY0ZThkZTkxIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNTYxMjM0NTYiLCJmc3BJZCI6IjIxIn19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI1NjIwMTAwMDAxIiwiZnNwSWQiOiIyMCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn0sImRhdGVPZkJpcnRoIjoiMTk4My0xMC0yNSJ9fSwiYW1vdW50Ijp7ImFtb3VudCI6IjEwMCIsImN1cnJlbmN5IjoiVVNEIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIifSwibm90ZSI6ImhlaiJ9',
            payerFsp: 'dfsp1',
            payeeFsp: 'dfsp2',
            transferId: transferId
          }
        },
        from: 'dfsp1',
        to: 'dfsp2',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'error'
      let response = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!response && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        response = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(response.payload, messageProtocol.content.payload, 'Notification sent successfully to Payee')
      test.end()
    })

    notificationTest.test('consume a PREPARE-DUPLICATE message and send PUT callback', async test => {
      const transferId = Uuid()
      const kafkaConfig = KafkaUtil.getKafkaConfig(Config.KAFKA_CONFIG, Enum.Kafka.Config.PRODUCER, Enum.Events.Event.Type.TRANSFER.toUpperCase(), Enum.Events.Event.Action.PREPARE.toUpperCase())
      const messageProtocol = {
        metadata: {
          event: {
            id: Uuid(),
            createdAt: new Date(),
            type: 'prepare',
            action: 'prepare-duplicate',
            state: {
              status: 'success',
              code: 0
            }
          }
        },
        content: {
          headers: {
            'content-length': 1038,
            'content-type': 'application/json',
            date: '2017-11-02T00:00:00.000Z',
            'fspiop-destination': 'dfsp2',
            'fspiop-source': 'dfsp1'
          },
          payload: {
            amount: { amount: 100, currency: 'USD' },
            transferState: 'COMMITTED',
            completedTimestamp: '2018-08-23T21:31:00.534+01:00',
            fulfilment: 'f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA',
            condition: 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvze1',
            expiration: '2018-08-24T21:31:00.534+01:00',
            ilpPacket: 'AQAAAAAAAABkEGcuZXdwMjEuaWQuODAwMjCCAhd7InRyYW5zYWN0aW9uSWQiOiJmODU0NzdkYi0xMzVkLTRlMDgtYThiNy0xMmIyMmQ4MmMwZDYiLCJxdW90ZUlkIjoiOWU2NGYzMjEtYzMyNC00ZDI0LTg5MmYtYzQ3ZWY0ZThkZTkxIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNTYxMjM0NTYiLCJmc3BJZCI6IjIxIn19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI1NjIwMTAwMDAxIiwiZnNwSWQiOiIyMCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn0sImRhdGVPZkJpcnRoIjoiMTk4My0xMC0yNSJ9fSwiYW1vdW50Ijp7ImFtb3VudCI6IjEwMCIsImN1cnJlbmN5IjoiVVNEIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIifSwibm90ZSI6ImhlaiJ9',
            payeeFsp: 'dfsp2',
            payerFsp: 'dfsp1',
            transferId: transferId
          }
        },
        to: 'dfsp1',
        from: 'switch',
        id: Uuid(),
        type: 'application/json'
      }

      const topicConfig = KafkaUtil.createGeneralTopicConf(Config.KAFKA_CONFIG.TOPIC_TEMPLATES.GENERAL_TOPIC_TEMPLATE.TEMPLATE, Enum.Events.Event.Type.NOTIFICATION, Enum.Events.Event.Action.EVENT)

      await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)

      const operation = 'put'
      let response = await getNotifications(messageProtocol.to, operation, transferId)
      let currentAttempts = 0
      while (!response && currentAttempts < (timeoutAttempts * callbackWaitSeconds)) {
        await sleep(callbackWaitSeconds)
        response = await getNotifications(messageProtocol.to, operation, transferId)
        currentAttempts++
      }
      test.deepEqual(response.payload, messageProtocol.content.payload, 'Notification sent successfully to Payer')
      test.end()
    })

    notificationTest.test('tear down', async test => {
      await Kafka.Producer.disconnect()
      test.end()
    })

    notificationTest.end()
  })
  notificationHandlerTest.end()
})

// function sleep (seconds) {
//   const waitUntil = new Date().getTime() + seconds * 1000
//   while (new Date().getTime() < waitUntil) {}
// }

function sleep (seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

const getNotifications = async (fsp, operation, id) => {
  try {
    const response = await Request.sendRequest(`${getNotificationUrl}/${fsp}/${operation}/${id}`, Fixtures.buildHeaders, Enum.Http.Headers.FSPIOP.SWITCH.value, Enum.Http.Headers.FSPIOP.SWITCH.value)
    return response.data
  } catch (error) {
    Logger.error(error)
    throw error
  }
}
