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
import {
  CommandMsg,
  IDomainMessage,
  ILogger,
  IMessagePublisher,
  IEntityDuplicateRepository,
  IESourcingStateRepository
} from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics } from '@mojaloop-poc/lib-public-messages'
import {
  IRunHandler,
  MessageConsumer,
  RDKafkaCompressionTypes,
  RDKafkaProducerOptions,
  RDKafkaMessagePublisher,
  RDKafkaConsumerOptions,
  RDKafkaConsumer,
  // InMemoryTransferDuplicateRepo,
  // RedisDuplicateRepo,
  // RedisDuplicateShardedRepo,
  // RedisDuplicateInfraTypes,
  EventSourcingStateRepo
} from '@mojaloop-poc/lib-infrastructure'
import { ParticpantsAgg } from '../domain/participants_agg'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CreateParticipantCmd } from '../messages/create_participant_cmd'
import { CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'
import { IParticipantRepo } from '../domain/participant_repo'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { CachedRedisParticipantStateRepo } from '../infrastructure/cachedredis_participant_repo'
import { CachedPersistedRedisParticipantStateRepo } from '../infrastructure/cachedpersistedredis_participant_repo'
import { RepoInfraTypes } from '../infrastructure'
import { RedisParticipantStateRepo } from '../infrastructure/redis_participant_repo'
import { InMemoryParticipantStateRepo } from '../infrastructure/inmemory_participant_repo'

export class ParticipantCmdHandler implements IRunHandler {
  private _logger: ILogger
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher
  private _stateCacheRepo: IParticipantRepo
  private _duplicateRepo: IEntityDuplicateRepository | null
  private _eventSourcingRepo: IESourcingStateRepository
  private _histoParticipantCmdHandlerMetric: any
  private _participantAgg: ParticpantsAgg

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdHandler::start - appConfig=${JSON.stringify(appConfig)}`)

    logger.isInfoEnabled() && logger.info(`ParticipantCmdHandler - Creating Statecache-repo of type ${appConfig.state_cache.type as string}`)
    switch (appConfig.state_cache.type) {
      case RepoInfraTypes.REDIS: {
        this._stateCacheRepo = new RedisParticipantStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, logger)
        break
      }
      case RepoInfraTypes.CACHEDREDIS: {
        this._stateCacheRepo = new CachedRedisParticipantStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, logger)
        break
      }
      case RepoInfraTypes.CACHEDPERSISTEDREDIS: {
        this._stateCacheRepo = new CachedPersistedRedisParticipantStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, logger)
        break
      }
      default: { // defaulting to In-Memory
        this._stateCacheRepo = new InMemoryParticipantStateRepo()
      }
    }
    logger.isInfoEnabled() && logger.info(`ParticipantCmdHandler - Created Statecache-repo of type ${this._stateCacheRepo.constructor.name}`)

    // logger.isInfoEnabled() && logger.info(`ParticipantCmdHandler - Creating Duplicate-repo of type ${appConfig.duplicate_store.type as string}`)
    // switch (appConfig.duplicate_store.type) {
    //   case RedisDuplicateInfraTypes.REDIS: {
    //     this._duplicateRepo = new RedisDuplicateRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'participants_duplicate', logger) // TODO move to config
    //     break
    //   }
    //   case RedisDuplicateInfraTypes.REDIS_SHARDED: {
    //     this._duplicateRepo = new RedisDuplicateShardedRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'participants_duplicate', logger)
    //     break
    //   }
    //   case RedisDuplicateInfraTypes.MEMORY: {
    //     this._duplicateRepo = new InMemoryTransferDuplicateRepo()
    //     break
    //   }
    //   default: {
    //     this._duplicateRepo = new RedisDuplicateRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'participants_duplicate', logger) // TODO move to config
    //   }
    // }
    // logger.isInfoEnabled() && logger.info(`ParticipantCmdHandler - Created Duplicate-repo of type ${this._duplicateRepo.constructor.name}`)

    logger.isInfoEnabled() && logger.info(`ParticipantCmdHandler - Creating Eventsourcing-repo of type ${appConfig.state_cache.type as string}`)
    switch (appConfig.state_cache.type) {
      case RepoInfraTypes.REDIS: {
        this._eventSourcingRepo = new EventSourcingStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, appConfig.kafka.host, 'Participant', ParticipantsTopics.SnapshotEvents, ParticipantsTopics.StateEvents, logger)
        break
      }
      default: {
        this._eventSourcingRepo = new EventSourcingStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, appConfig.kafka.host, 'Participant', ParticipantsTopics.SnapshotEvents, ParticipantsTopics.StateEvents, logger)
      }
    }
    logger.isInfoEnabled() && logger.info(`ParticipantCmdHandler - Created Eventsourcing-repo of type ${this._eventSourcingRepo.constructor.name}`)

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdHandler - Creating ${appConfig.kafka.producer as string} participantCmdHandler.kafkaMsgPublisher...`)
    let clientId = `participantCmdHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
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

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdHandler - Created kafkaMsgPublisher of type ${this._publisher.constructor.name}`)

    await this._stateCacheRepo.init()
    // await this._duplicateRepo.init()
    this._duplicateRepo = null
    await this._eventSourcingRepo.init()
    await this._publisher.init()

    this._participantAgg = new ParticpantsAgg(this._stateCacheRepo, this._duplicateRepo, this._eventSourcingRepo, this._publisher, logger)

    this._histoParticipantCmdHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'participantCmdHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for participantCmdHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdConsumer - Creating ${appConfig.kafka.consumer as string} participantCmdConsumer...`)
    clientId = `participantCmdConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`

    const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
      client: {
        consumerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          'group.id': 'participantCmdGroup',
          'enable.auto.commit': appConfig.kafka.autocommit,
          'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
          'client.id': clientId,
          'socket.keepalive.enable': true,
          'fetch.min.bytes': appConfig.kafka.fetchMinBytes,
          'fetch.wait.max.ms': appConfig.kafka.fetchWaitMaxMs
        },
        topicConfig: {},
        rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
      },
      topics: [ParticipantsTopics.Commands]
    }
    this._consumer = new RDKafkaConsumer(rdKafkaConsumerOptions, this._logger)

    this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdConsumer - Created kafkaConsumer of type ${this._consumer.constructor.name}`)

    this._logger.isInfoEnabled() && this._logger.info('ParticipantCmdConsumer - Initializing participantCmdConsumer...')

    // load all participants to mem
    // await this._participantAgg.loadAllToInMemoryCache()

    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await this._consumer.init(this._cmdHandler.bind(this), null) // by design we're interested in all commands
  }

  private async _cmdHandler (message: IDomainMessage): Promise<void> {
    const histTimer = this._histoParticipantCmdHandlerMetric.startTimer()
    const evtname = message.msgName ?? 'unknown'
    try {
      this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
      let participantCmd: CommandMsg | undefined
      // # Transform messages into correct Command
      switch (message.msgName) {
        case CreateParticipantCmd.name: {
          participantCmd = CreateParticipantCmd.fromIDomainMessage(message)
          break
        }
        case ReservePayerFundsCmd.name: {
          participantCmd = ReservePayerFundsCmd.fromIDomainMessage(message)
          break
        }
        case CommitPayeeFundsCmd.name: {
          participantCmd = CommitPayeeFundsCmd.fromIDomainMessage(message)
          break
        }
        default: {
          this._logger.isWarnEnabled() && this._logger.warn(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
          break
        }
      }
      let processCommandResult: boolean = false
      if (participantCmd != null) {
        processCommandResult = await this._participantAgg.processCommand(participantCmd)
      } else {
        this._logger.isWarnEnabled() && this._logger.warn(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
      }
      this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: ${processCommandResult.toString()}`)
      histTimer({ success: 'true', evtname })
    } catch (err) {
      const errMsg: string = err?.message?.toString()
      this._logger.isInfoEnabled() && this._logger.info(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histTimer({ success: 'false', error: err.message, evtname })
    }
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
    await this._stateCacheRepo.destroy()
    // await this._duplicateRepo.destroy()
    await this._eventSourcingRepo.destroy()
  }
}
