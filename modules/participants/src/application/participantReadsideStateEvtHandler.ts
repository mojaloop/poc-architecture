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
// import {InMemoryParticipantStateRepo} from "../infrastructure/inmemory_participant_repo";
import { IDomainMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics } from '@mojaloop-poc/lib-public-messages'
import { IRunHandler, MessageConsumer, RDKafkaConsumerOptions, RDKafkaConsumer } from '@mojaloop-poc/lib-infrastructure'
import { InvalidParticipantEvtError } from './errors'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { MongoDbReadsideParticipantRepo } from '../infrastructure/mongodb_readside_participant_repo'
import { ParticipantCreatedStateEvt, ParticipantCreatedStateEvtPayload } from './../messages/participant_created_stateevt'
import { ParticipantPositionChangedStateEvt, ParticipantPositionChangedStateEvtPayload } from './../messages/participant_position_changed_stateevt'

export class ParticipantReadsideStateEvtHandler implements IRunHandler {
  private _logger: ILogger
  private _consumer: MessageConsumer
  private _clientId: string
  private _readSideRepo: MongoDbReadsideParticipantRepo
  private _histoParticipantReadsideStateEvtHandlerMetric: any

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    this._logger.isInfoEnabled() && this._logger.info(`ParticipantReadsideStateEvtHandler::start - appConfig=${JSON.stringify(appConfig)}`)
    this._clientId = `participantReadsideStateEvtHandler-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantReadsideStateEvtHandler - Creating repo of type ${MongoDbReadsideParticipantRepo.constructor.name}`)
    this._readSideRepo = new MongoDbReadsideParticipantRepo(appConfig.readside_store.uri, logger)
    await this._readSideRepo.init()

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantReadsideStateEvtHandler - Created repo of type ${this._readSideRepo.constructor.name}`)

    this._histoParticipantReadsideStateEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'participantReadsideStateEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for participantReadsideStateEvtHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantReadsideStateEvtHandler - Creating ${appConfig.kafka.consumer as string}...`)

    const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
      client: {
        consumerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          'group.id': 'participantReadsideStateEvtHandlerGroup',
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
      topics: [ParticipantsTopics.StateEvents]
    }
    this._consumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)

    logger.isInfoEnabled() && logger.info(`ParticipantReadsideStateEvtHandler - Created kafkaConsumer of type ${this._consumer.constructor.name}`)

    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await this._consumer.init(this._messageHandler.bind(this), null) // we're interested in all stateEvents
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._readSideRepo.destroy()
  }

  async _messageHandler (message: IDomainMessage): Promise<void> {
    const histTimer = this._histoParticipantReadsideStateEvtHandlerMetric.startTimer()
    const evtname = message.msgName ?? 'unknown'
    try {
      this._logger.isInfoEnabled() && this._logger.info(`ParticipantReadsideStateEvtHandler - persisting state event event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)

      switch (message.msgName) {
        case ParticipantCreatedStateEvt.name: {
          const evt = ParticipantCreatedStateEvt.fromIDomainMessage(message)
          if (evt == null) throw new InvalidParticipantEvtError(`ParticipantReadsideStateEvtHandler is unable to persist state event - ${message.msgName} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          await this._handleParticipantCreatedStateEvt(evt)
          break
        }
        case ParticipantPositionChangedStateEvt.name: {
          const evt = ParticipantPositionChangedStateEvt.fromIDomainMessage(message)
          if (evt == null) throw new InvalidParticipantEvtError(`ParticipantReadsideStateEvtHandler is unable to persist state event - ${message.msgName} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          await this._handleParticipantPositionChangedStateEvt(evt)
          break
        }
        default: {
          this._logger.isDebugEnabled() && this._logger.debug(`ParticipantReadsideStateEvtHandler - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
          histTimer({ success: 'true', evtname })
          return
        }
      }

      this._logger.isInfoEnabled() && this._logger.info(`ParticipantReadsideStateEvtHandler - persisted state event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: true`)
      histTimer({ success: 'true', evtname })
    } catch (err) {
      const errMsg: string = err?.message?.toString()
      this._logger.isWarnEnabled() && this._logger.warn(`ParticipantReadsideStateEvtHandler - persisting state event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histTimer({ success: 'false', /* error: err.message, */ evtname })
    }
  }

  private async _handleParticipantCreatedStateEvt (evt: ParticipantCreatedStateEvt): Promise<void> {
    const payload: ParticipantCreatedStateEvtPayload = evt.payload

    // we don't care if one exists already, the read side has no logic and asks no questions

    const success: boolean = await this._readSideRepo.insert({
      id: payload.participant.id,
      name: payload.participant.name,
      accounts: payload.participant.accounts,
      endpoints: payload.participant.endpoints,
      partition: payload.participant.partition, // do we care about the partition here, or is it just a write side concern?
      created_at: evt.msgTimestamp,
      updated_at: evt.msgTimestamp,
      version: 1 // NOTE we're not doing versions yet
    })

    if (!success) {
      throw new InvalidParticipantEvtError(`ParticipantReadsideStateEvtHandler is unable to persist state event - Participant '${evt.msgKey}' is Invalid - ${evt.msgName}:${evt.msgKey}:${evt.msgId}`)
    }
  }

  private async _handleParticipantPositionChangedStateEvt (evt: ParticipantPositionChangedStateEvt): Promise<void> {
    const payload: ParticipantPositionChangedStateEvtPayload = evt.payload

    const success: boolean = await this._readSideRepo.updatePosition(
      payload.participant.id,
      payload.participant.currency,
      payload.participant.currentPosition
    ) // we don.'t change versions (not implemented yet)

    if (!success) {
      throw new InvalidParticipantEvtError(`ParticipantReadsideStateEvtHandler is unable to persist state event - Participant '${evt.msgKey}' is Invalid - ${evt?.msgName}:${evt?.msgKey}:${evt?.msgId}`)
    }
  }
}
