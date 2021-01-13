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
import { IDomainMessage, ILogger, IMessagePublisher } from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics } from '@mojaloop-poc/lib-public-messages'
import {
  IRunHandler,
  MessageConsumer,
  RDKafkaCompressionTypes,
  RDKafkaConsumer,
  RDKafkaConsumerOptions,
  RDKafkaMessagePublisher,
  RDKafkaProducerOptions
} from '@mojaloop-poc/lib-infrastructure'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { RedisParticipantStateRepo } from '../infrastructure/redis_participant_repo'
import { SnapshotParticipantStateCmd } from '../messages/snapshot_participant_state_cmd'
import { ParticipantSnapshotOperatorState, ParticipantSnapshotState } from '../domain/participant_operator_state'
import { RedisParticipantOperatorStateRepo } from '../infrastructure/redis_participant_operator_repo'
import { SnapshotOperatorExecuteCmd } from '../messages/snapshot_operator_execute_cmd'
import Timeout = NodeJS.Timeout

// TODO move these 3 constants to config value
const MAX_STATE_EVENTS_UNTIL_SNAPSHOTS_ISSUED: number = 10000 // development, TODO: Figure out what is ok
const MAX_SECS_BETWEEN_SNAPSHOTS_ISSUED: number = 60 * 60 // snapshot every 1 hour - TODO: production values should be around 12 hours or even 1 day
const TIMER_INTERVAL_SECS: number = 5 * 60 // timer runs every 5 mins

export class ParticipantSnapshotOperator implements IRunHandler {
  private _logger: ILogger
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher
  private readonly _snapshotStates: Map<string, ParticipantSnapshotState> = new Map<string, ParticipantSnapshotState>()
  private _clientId: string
  private _operatorStateRepo: RedisParticipantOperatorStateRepo
  private _intervalTimer: Timeout
  // private _histoParticipantSnapshotOperatorMetric: any

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    this._logger.isInfoEnabled() && this._logger.info(`ParticipantSnapshotOperator::start - appConfig=${JSON.stringify(appConfig)}`)
    // NOTE fixed clientId, as there should only be 1 operator at a time
    this._clientId = `ParticipantSnapshotOperator-${appConfig.kafka.consumer as string}`

    // TODO add metrics
    // this._histoParticipantSnapshotOperatorMetric = metrics.get( // Create a new Histogram instrumentation
    //   'ParticipantSnapshotOperator', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
    //   'Instrumentation for ParticipantSnapshotOperator', // Description of metric
    //   ['success', 'error', 'evtname'] // Define a custom label 'success'
    // )
    //
    // this._histoParticipantStateStoreTimeMetric = metrics.getHistogram( // Create a new Histogram instrumentation
    //   'participantStateStoreLatency', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
    //   'Time delta between state msg generated vs stored', // Description of metric
    //   ['success', 'evtname'] // Define a custom label 'success'
    // )

    // create and initialise the RedisParticipantOperatorStateRepo used to load and store operator state
    logger.isInfoEnabled() && logger.info('ParticipantSnapshotOperator - Creating RedisParticipantOperatorStateRepo...')
    this._operatorStateRepo = new RedisParticipantOperatorStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, logger)
    await this._operatorStateRepo.init()
    logger.isInfoEnabled() && logger.info('ParticipantSnapshotOperator - Created and init\'ed RedisParticipantOperatorStateRepo, trying to load existing state...')
    // load possible existing state
    await this._loadState()
    logger.isInfoEnabled() && logger.info('ParticipantSnapshotOperator - Created and init\'ed RedisParticipantOperatorStateRepo')

    // create and initialise the RedisParticipantStateRepo to get all participant IDs
    logger.isInfoEnabled() && logger.info('ParticipantSnapshotOperator - Creating Statecache-repo of type RedisParticipantStateRepo')
    const _stateCacheRepo: RedisParticipantStateRepo = new RedisParticipantStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, logger)
    await _stateCacheRepo.init()
    const participantIds: string[] = await _stateCacheRepo.getAllIds()
    logger.isInfoEnabled() && logger.info('ParticipantSnapshotOperator - Created and init\'ed Statecache-repo of type RedisParticipantStateRepo')
    // check all participant IDs and create a ParticipantSnapshotState for each known participant ID - if not already in the operator state
    this._logger.isInfoEnabled() && this._logger.info('ParticipantSnapshotOperator - creating initial list of ParticipantSnapshotState from cache...')
    participantIds.forEach((id: string) => {
      const participantSnapState: ParticipantSnapshotState | undefined = this._snapshotStates.get(id)
      if (participantSnapState === undefined) {
        // if first time we see them, we assume defaults (safe option): that a snapshot is needed
        this._snapshotStates.set(id, new ParticipantSnapshotState(id, MAX_STATE_EVENTS_UNTIL_SNAPSHOTS_ISSUED))
      }
    })
    this._logger.isInfoEnabled() && this._logger.info(`ParticipantSnapshotOperator - initial list of ParticipantSnapshotState created with ${this._snapshotStates.size} participant ids`)

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantSnapshotOperator - Creating ${appConfig.kafka.producer as string} kafkaMsgPublisher...`)
    const clientId = `participantSnapshotOperator-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
    const rdKafkaProducerOptions: RDKafkaProducerOptions = {
      client: {
        producerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          dr_cb: true,
          'client.id': clientId,
          'socket.keepalive.enable': true,
          'compression.codec': appConfig.kafka.gzipCompression === true ? RDKafkaCompressionTypes.GZIP : RDKafkaCompressionTypes.NONE
        },
        topicConfig: {
          // partitioner: RDKafkaPartioner.MURMUR2_RANDOM // default java algorithm, seems to have worse random distribution for hashing than rdkafka's default
        }
      }
    }
    this._publisher = new RDKafkaMessagePublisher(rdKafkaProducerOptions, logger)
    await this._publisher.init()
    this._logger.isInfoEnabled() && this._logger.info(`ParticipantSnapshotOperator - Created and init'ed kafkaMsgPublisher of type ${this._publisher.constructor.name}`)

    // schedule the timer
    this._logger.isInfoEnabled() && this._logger.info(`ParticipantSnapshotOperator - setting up timer, with a ${TIMER_INTERVAL_SECS} secs interval`)
    this._intervalTimer = setInterval(this._onTimer.bind(this), TIMER_INTERVAL_SECS * 1000)

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantSnapshotOperator - Creating ${appConfig.kafka.consumer as string}...`)
    const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
      client: {
        consumerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          'group.id': 'ParticipantSnapshotOperatorGroup',
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
      topics: [ParticipantsTopics.StateEvents, ParticipantsTopics.SnapshotEvents, ParticipantsTopics.SnapshotOperatorCommands]
    }
    this._consumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)

    logger.isInfoEnabled() && logger.info(`ParticipantSnapshotOperator - Created kafkaConsumer of type ${this._consumer.constructor.name}`)

    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await this._consumer.init(this._messageHandler.bind(this), null) // we're interested in all stateEvents
    logger.isInfoEnabled() && logger.info('ParticipantSnapshotOperator - ready')
  }

  private async _loadState (): Promise<void> {
    this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - loading possible existing state...')
    const operatorState: ParticipantSnapshotOperatorState | null = await this._operatorStateRepo.load()
    if (operatorState?.participantSnapshotStates !== null) {
      operatorState?.participantSnapshotStates.forEach((participantSnapState: ParticipantSnapshotState) => {
        this._snapshotStates.set(participantSnapState.participantId, participantSnapState)
      })
      this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - existing state loaded')
    } else {
      this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - existing state mot found')
    }
  }

  private async _updateState (): Promise<void> {
    const state: ParticipantSnapshotOperatorState = new ParticipantSnapshotOperatorState()
    state.lastOnTimerTs = Date.now()
    state.participantSnapshotStates = Array.from(this._snapshotStates.values())

    await this._operatorStateRepo.store(state)
  }

  async destroy (): Promise<void> {
    clearInterval(this._intervalTimer)
    await this._consumer.destroy(true)
    await this._operatorStateRepo.destroy()
    await this._publisher.destroy()
  }

  _onTimer (): void {
    this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - onTimer() - starting...')

    const cmd: SnapshotOperatorExecuteCmd = new SnapshotOperatorExecuteCmd()
    this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - onTimer() - publishing SnapshotOperatorExecuteCmd...')

    this._publisher.publish(cmd).then(() => {
      this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - onTimer() - successfully published SnapshotOperatorExecuteCmd')
    }).catch((reason: string) => {
      this._logger.isErrorEnabled() && this._logger.error(`ParticipantSnapshotOperator - onTimer() - couldn't get publish SnapshotOperatorExecuteCmd - reason: ${reason}`)
    })
  }

  async _execute (): Promise<void> {
    this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - execution - starting loading OperatorState...')

    await this._loadState()

    this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - execution - starting loading OperatorState...')

    if (this._snapshotStates.size === 0) {
      this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - execution - empty ParticipantSnapshotState list, exiting')
      return
    }

    const snapshotCmds: SnapshotParticipantStateCmd[] = []

    Array.from(this._snapshotStates.values()).forEach((state: ParticipantSnapshotState) => {
      if (state.stateEventsToNextSnapshot <= 0 || state.stateEventsToNextSnapshot === 0 || Date.now() - state.lastSnapshotTs >= MAX_SECS_BETWEEN_SNAPSHOTS_ISSUED * 1000) {
        snapshotCmds.push(new SnapshotParticipantStateCmd({
          participantId: state.participantId
        }))
        this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - execution - scheduled participant with id: ${state.participantId} for snapshotting`)
      }
    })

    if (snapshotCmds.length === 0) {
      this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - execution - no participants scheduled for snapshotting, exiting')
      return
    }

    this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - execution - publishing ${snapshotCmds.length} SnapshotParticipantStateCmd...`)

    this._publisher.publishMany(snapshotCmds).then(() => {
      this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - execution - successfully published ${snapshotCmds.length} SnapshotParticipantStateCmd(s)`)

      // update state to record lastOnTimerTs
      this._updateState().then(() => {
        this._logger.isDebugEnabled() && this._logger.debug('ParticipantSnapshotOperator - execution - ParticipantSnapshotOperatorState updated')
      }).catch(() => {
        this._logger.isErrorEnabled() && this._logger.error('ParticipantSnapshotOperator - execution - Error trying to update ParticipantSnapshotOperatorState')
      })
    }).catch((reason: string) => {
      this._logger.isErrorEnabled() && this._logger.error(`ParticipantSnapshotOperator - execution - couldn't get publish SnapshotParticipantStateCmd's - reason: ${reason}`)
    })
  }

  async _messageHandler (message: IDomainMessage): Promise<void> {
    // const histTimer = this._histoParticipantSnapshotOperatorMetric.startTimer()
    // const evtname = message.msgName ?? 'unknown'
    this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - started processing state event (msgName:msgKey:msgId:aggregateId): ${message?.msgName}:${message?.msgKey}:${message?.msgId}:${message?.aggregateId} ...`)

    try {
      if (message.aggregateId === undefined || message.aggregateId === null) {
        this._logger.isWarnEnabled() && this._logger.warn('ParticipantSnapshotOperator - received state event has invalid aggregateId - ignoring it')
        return
      }

      const participantId: string = message.aggregateId
      const state: ParticipantSnapshotState | undefined = this._snapshotStates.get(participantId)

      // TODO check if topic === ParticipantsTopics.SnapshotOperatorCommands
      if (message.msgTopic === ParticipantsTopics.SnapshotOperatorCommands) {
        await this._execute()
      } else {
        if (state === undefined) {
          this._snapshotStates.set(participantId, new ParticipantSnapshotState(participantId, MAX_STATE_EVENTS_UNTIL_SNAPSHOTS_ISSUED))
          this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - added new ParticipantSnapshotState for participantId: ${participantId}`)
        } else {
          if (message.msgTopic === ParticipantsTopics.SnapshotEvents) {
            // snapshot, reset te state for this participant
            state.stateEventsToNextSnapshot = MAX_STATE_EVENTS_UNTIL_SNAPSHOTS_ISSUED
            state.lastSnapshotTs = Date.now()
            this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - SnapshotEvents event detected for participant: ${participantId} - its ParticipantSnapshotState was reset`)
          } else if (message.msgTopic === ParticipantsTopics.StateEvents) {
            // we don't care about specific events, any state event will decrease the counter
            state.stateEventsToNextSnapshot--
            this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - decreased stateEventsToNextSnapshot counter for ParticipantSnapshotState with participantId: ${participantId}`)
          }
        }
      }

      await this._updateState()

      // histTimer({ success: 'true', evtname })
      // const msgSentVsDataStoredTimeDelta = (Date.now()) - message.msgTimestamp
      // this._histoParticipantStateStoreTimeMetric.observe({}, msgSentVsDataStoredTimeDelta / 1000)
    } catch (err) {
      const errMsg: string = err?.message?.toString()
      this._logger.isWarnEnabled() && this._logger.warn(`ParticipantSnapshotOperator - processing state event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      // histTimer({ success: 'false', /* error: err.message, */ evtname })
    }
    this._logger.isDebugEnabled() && this._logger.debug(`ParticipantSnapshotOperator - finished processing state event (msgName:msgKey:msgId:aggregateId): ${message?.msgName}:${message?.msgKey}:${message?.msgId}:${message?.aggregateId}`)
  }
}
