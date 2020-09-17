/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Coil
 - Donovan Changfoot <donovan.changfoot@coil.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'
// import { v4 as uuidv4 } from 'uuid'
// import {InMemoryTransferStateRepo} from "../infrastructure/inmemory_transfer_repo";
import { IDomainMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import { IRunHandler, MessageConsumer, RDKafkaConsumerOptions, RDKafkaConsumer } from '@mojaloop-poc/lib-infrastructure'
import { InvalidTransferEvtError } from './errors'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { MongoDbReadsideTransferRepo } from '../infrastructure/mongodb_readside_transfer_repo'
import { TransferPreparedStateEvt, TransferPreparedStateEvtPayload } from '../messages/transfer_prepared_stateevt'
import { TransferFulfiledStateEvt, TransferFulfiledStateEvtPayload } from '../messages/transfer_fulfiled_stateevt'
import { TransferStateChangedStateEvt, TransferStateChangedStateEvtPayload } from '../messages/transfer_state_changed_stateevt'
import { TransferInternalStates } from '../domain/transfer_entity'

export class TransferStateEvtHandler implements IRunHandler {
  private _logger: ILogger
  private _consumer: MessageConsumer
  private _clientId: string
  private _readSideRepo: MongoDbReadsideTransferRepo
  private _histoTransferStateEvtHandlerMetric: any
  private _histoTransferStateStoreTimeMetric: any

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    this._logger.isInfoEnabled() && this._logger.info(`TransferStateEvtHandler::start - appConfig=${JSON.stringify(appConfig)}`)
    this._clientId = `transferStateEvtHandler-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`

    this._logger.isInfoEnabled() && this._logger.info(`TransferStateEvtHandler - Creating repo of type ${MongoDbReadsideTransferRepo.constructor.name}`)
    this._readSideRepo = new MongoDbReadsideTransferRepo(appConfig.readside_store.uri, logger)
    await this._readSideRepo.init()

    this._logger.isInfoEnabled() && this._logger.info(`TransferStateEvtHandler - Created repo of type ${this._readSideRepo.constructor.name}`)

    this._histoTransferStateEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferStateEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferStateEvtHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    this._histoTransferStateStoreTimeMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferStateStoreLatency', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Time delta between state msg generated vs stored', // Description of metric
      ['success', 'evtname'] // Define a custom label 'success'
    )

    this._logger.isInfoEnabled() && this._logger.info(`TransferStateEvtHandler - Creating ${appConfig.kafka.consumer as string}...`)

    const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
      client: {
        consumerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          'group.id': 'transferStateEvtHandlerGroup',
          'enable.auto.commit': appConfig.kafka.autocommit,
          'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
          'client.id': this._clientId,
          'socket.keepalive.enable': true,
          'fetch.min.bytes': appConfig.kafka.fetchMinBytes,
          'fetch.wait.max.ms': appConfig.kafka.fetchWaitMaxMs
        },
        topicConfig: {},
        rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
      },
      topics: [TransfersTopics.StateEvents]
    }
    this._consumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)

    logger.isInfoEnabled() && logger.info(`TransferStateEvtHandler - Created kafkaConsumer of type ${this._consumer.constructor.name}`)

    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await this._consumer.init(this._messageHandler.bind(this), null) // we're interested in all stateEvents
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._readSideRepo.destroy()
  }

  async _messageHandler (message: IDomainMessage): Promise<void> {
    const histTimer = this._histoTransferStateEvtHandlerMetric.startTimer()
    const evtname = message.msgName ?? 'unknown'
    try {
      this._logger.isInfoEnabled() && this._logger.info(`TransferStateEvtHandler - persisting state event event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)

      switch (message.msgName) {
        case TransferPreparedStateEvt.name: {
          const evt = TransferPreparedStateEvt.fromIDomainMessage(message)
          if (evt == null) throw new InvalidTransferEvtError(`TransferPreparedStateEvt is unable to persist state event - ${message.msgName} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          await this._handleTransferPreparedStateEvt(evt)
          break
        }
        case TransferFulfiledStateEvt.name: {
          const evt = TransferFulfiledStateEvt.fromIDomainMessage(message)
          if (evt == null) throw new InvalidTransferEvtError(`TransferFulfiledStateEvt is unable to persist state event - ${message.msgName} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          await this._handleTransferFulfiledStateEvt(evt)
          break
        }
        case TransferStateChangedStateEvt.name: {
          const evt = TransferStateChangedStateEvt.fromIDomainMessage(message)
          if (evt == null) throw new InvalidTransferEvtError(`TransferStateChangedStateEvt is unable to persist state event - ${message.msgName} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          await this._handleTransferStateChangedStateEvt(evt)
          break
        }
        default: {
          this._logger.isDebugEnabled() && this._logger.debug(`TransferStateEvtHandler - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
          histTimer({ success: 'true', evtname })
          return
        }
      }

      this._logger.isInfoEnabled() && this._logger.info(`TransferStateEvtHandler - persisted state event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: true`)
      histTimer({ success: 'true', evtname })
      const msgSentVsDataStoredTimeDelta = (Date.now()) - message.msgTimestamp
      this._histoTransferStateStoreTimeMetric.observe({}, msgSentVsDataStoredTimeDelta / 1000)
    } catch (err) {
      this._logger.isErrorEnabled() && this._logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
      const errMsg: string = err?.message?.toString()
      this._logger.isWarnEnabled() && this._logger.warn(`TransferStateEvtHandler - persisting state event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
      histTimer({ success: 'false', /* error: err.message, */ evtname })
    }
  }

  private async _handleTransferPreparedStateEvt (evt: TransferPreparedStateEvt): Promise<void> {
    const payload: TransferPreparedStateEvtPayload = evt.payload

    // we don't care if one exists already, the read side has no logic and asks no questions

    const success: boolean = await this._readSideRepo.insertTransferState({
      id: payload.transfer.id,
      created_at: evt.msgTimestamp,
      updated_at: evt.msgTimestamp,
      version: 1, // NOTE we're not doing versions yet

      amount: payload.transfer.amount,
      currency: payload.transfer.currency,
      transferInternalState: TransferInternalStates.RECEIVED_PREPARE,
      payerId: payload.transfer.payerId,
      payeeId: payload.transfer.payeeId,
      expiration: payload.transfer.expiration,
      condition: payload.transfer.condition,
      prepare: payload.transfer.prepare,
      fulfilment: payload.transfer.fulfilment,
      completedTimestamp: '',
      fulfil: payload.transfer.fulfil,
      reject: payload.transfer.reject
    })

    if (!success) {
      throw new InvalidTransferEvtError(`_handleTransferPreparedStateEvt is unable to persist state event - Transfer '${evt.msgKey}' is Invalid - ${evt.msgName}:${evt.msgKey}:${evt.msgId}`)
    }
  }

  private async _handleTransferFulfiledStateEvt (evt: TransferFulfiledStateEvt): Promise<void> {
    const payload: TransferFulfiledStateEvtPayload = evt.payload

    // we don't care if one exists already, the read side has no logic and asks no questions
    const success: boolean = await this._readSideRepo.updateFulfil({
      transfer: {
        id: payload.transfer.id,
        fulfilment: payload.transfer.fulfilment,
        completedTimestamp: payload.transfer.completedTimestamp,
        fulfil: payload.transfer.fulfil,
        transferInternalState: TransferInternalStates.RECEIVED_FULFIL
      }
    })

    if (!success) {
      throw new InvalidTransferEvtError(`_handleTransferFulfiledStateEvt is unable to persist state event - Transfer '${evt.msgKey}' is Invalid - ${evt.msgName}:${evt.msgKey}:${evt.msgId}`)
    }
  }

  private async _handleTransferStateChangedStateEvt (evt: TransferStateChangedStateEvt): Promise<void> {
    const payload: TransferStateChangedStateEvtPayload = evt.payload

    // we don't care if one exists already, the read side has no logic and asks no questions
    const success: boolean = await this._readSideRepo.updateState(payload)

    if (!success) {
      throw new InvalidTransferEvtError(`_handleTransferStateChangedStateEvt is unable to persist state event - Transfer '${evt.msgKey}' is Invalid - ${evt.msgName}:${evt.msgKey}:${evt.msgId}`)
    }
  }
}
