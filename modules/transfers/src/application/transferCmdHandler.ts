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
// import {InMemorytransferStateRepo} from "../infrastructure/inmemory_transfer_repo";
import {
  CommandMsg,
  IDomainMessage,
  IMessagePublisher,
  ILogger,
  IEntityDuplicateRepository
} from '@mojaloop-poc/lib-domain'
import {
  IRunHandler,
  MessageConsumer,
  RDKafkaCompressionTypes,
  RDKafkaProducerOptions,
  RDKafkaMessagePublisher,
  RDKafkaConsumerOptions,
  RDKafkaConsumer,
  InMemoryTransferDuplicateRepo,
  RedisDuplicateRepo,
  RedisDuplicateShardedRepo,
  RedisDuplicateInfraTypes
} from '@mojaloop-poc/lib-infrastructure'
import { TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { TransfersAgg } from '../domain/transfers_agg'
import { PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { RedisTransferStateRepo } from '../infrastructure/redis_transfer_repo'
import { ITransfersRepo } from '../domain/transfers_repo'
import { FulfilTransferCmd } from '../messages/fulfil_transfer_cmd'
import { AckPayeeFundsCommittedCmd } from '../messages/ack_payee_funds_committed_cmd'
import { InMemoryTransferStateRepo } from '../infrastructure/inmemory_transfer_repo'
import { RepoInfraTypes } from '../infrastructure'
import { CachedPersistedRedisTransferStateRepo } from '../infrastructure/cachedpersistedredis_transfer_repo'
import { CachedRedisTransferStateRepo } from '../infrastructure/cachedredis_transfer_repo'
import { InMemoryNodeCacheTransferStateRepo } from '../infrastructure/inmemory_node_cache_transfer_repo'

export class TransferCmdHandler implements IRunHandler {
  private _logger: ILogger
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher
  private _entityStateRepo: ITransfersRepo
  private _duplicateRepo: IEntityDuplicateRepository
  // private _eventSourcingRepo: IESourcingStateRepository
  private _histoTransfersCmdHandlerMetric: any
  private _transfersAgg: TransfersAgg

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    this._logger.isInfoEnabled() && this._logger.info(`TransferCmdHandler::start - appConfig=${JSON.stringify(appConfig)}`)

    // logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Creating Statecache-repo of type ${appConfig.state_cache.type as string}`)
    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Creating Statecache-repo of type ${appConfig.entity_state.type as string}`)
    // switch (appConfig.state_cache.type) {
    switch (appConfig.entity_state.type) {
      case RepoInfraTypes.REDIS: {
        this._entityStateRepo = new RedisTransferStateRepo(appConfig.entity_state.host, appConfig.entity_state.clustered, logger, appConfig.entity_state.expirationInSeconds)
        break
      }
      case RepoInfraTypes.CACHEDREDIS: {
        this._entityStateRepo = new CachedRedisTransferStateRepo(appConfig.entity_state.host, appConfig.entity_state.clustered, logger, appConfig.entity_state.expirationInSeconds)
        break
      }
      case RepoInfraTypes.CACHEDPERSISTEDREDIS: {
        this._entityStateRepo = new CachedPersistedRedisTransferStateRepo(appConfig.entity_state.host, appConfig.entity_state.clustered, logger, appConfig.entity_state.expirationInSeconds)
        break
      }
      case RepoInfraTypes.NODECACHE: {
        this._entityStateRepo = new InMemoryNodeCacheTransferStateRepo(logger, appConfig.entity_state.expirationInSeconds)
        break
      }
      default: { // defaulting to In-Memory
        this._entityStateRepo = new InMemoryTransferStateRepo()
      }
    }
    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Created Statecache-repo of type ${this._entityStateRepo.constructor.name}`)

    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Creating Duplicate-repo of type ${appConfig.duplicate_store.type as string}`)
    switch (appConfig.duplicate_store.type) {
      case RedisDuplicateInfraTypes.REDIS: {
        this._duplicateRepo = new RedisDuplicateRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'transfers_duplicate', logger)
        break
      }
      case RedisDuplicateInfraTypes.REDIS_SHARDED: {
        this._duplicateRepo = new RedisDuplicateShardedRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'transfers_duplicate', logger)
        break
      }
      case RedisDuplicateInfraTypes.MEMORY: {
        this._duplicateRepo = new InMemoryTransferDuplicateRepo()
        break
      }
      default: {
        this._duplicateRepo = new RedisDuplicateRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'transfers_duplicate', logger)
      }
    }
    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Created Duplicate-repo of type ${this._duplicateRepo.constructor.name}`)

    /*
    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Creating Eventsourcing-repo of type ${appConfig.state_cache.type as string}`)
    switch (appConfig.state_cache.type) {
      case RepoInfraTypes.REDIS: {
        this._eventSourcingRepo = new EventSourcingStateRepo(appConfig.state_cache.host, appConfig.kafka.host, 'Transfer', TransfersTopics.SnapshotEvents, TransfersTopics.StateEvents, this._logger)
        break
      }
      default: {
        this._eventSourcingRepo = new EventSourcingStateRepo(appConfig.state_cache.host, appConfig.kafka.host, 'Transfer', TransfersTopics.SnapshotEvents, TransfersTopics.StateEvents, this._logger)
      }
    }
    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Created Eventsourcing-repo of type ${this._eventSourcingRepo.constructor.name}`)
     */

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    this._logger.isInfoEnabled() && this._logger.info(`TransferCmdHandler - Creating ${appConfig.kafka.producer} transferCmdHandler.kafkaMsgPublisher...`)
    let clientId = `transferCmdHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
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
    this._publisher = new RDKafkaMessagePublisher(rdKafkaProducerOptions, this._logger)

    this._logger.isInfoEnabled() && this._logger.info(`TransferCmdHandler - Created kafkaMsgPublisher of type ${this._publisher.constructor.name}`)

    await this._entityStateRepo.init()
    await this._duplicateRepo.init()
    // await this._eventSourcingRepo.init()
    await this._publisher.init()

    // this._transfersAgg = new TransfersAgg(this._entityStateRepo, this._duplicateRepo, this._eventSourcingRepo, this._publisher, this._logger)
    this._transfersAgg = new TransfersAgg(this._entityStateRepo, this._duplicateRepo, this._publisher, this._logger)

    this._histoTransfersCmdHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferCmdHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferCmdHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    this._logger.isInfoEnabled() && this._logger.info(`TransferCmdHandler - Creating ${appConfig.kafka.consumer as string} transferCmdConsumer...`)
    clientId = `transferCmdConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`

    const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
      client: {
        consumerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          'group.id': 'transferCmdGroup',
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
      topics: [TransfersTopics.Commands]
    }
    this._consumer = new RDKafkaConsumer(rdKafkaConsumerOptions, this._logger)

    this._logger.isInfoEnabled() && this._logger.info(`TransferCmdHandler - Created kafkaConsumer of type ${this._consumer.constructor.name}`)

    this._logger.isInfoEnabled() && this._logger.info('TransferCmdHandler - Initializing transferCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await this._consumer.init(this._cmdHandler.bind(this), null) // by design we're interested in all commands
  }

  private async _cmdHandler (message: IDomainMessage): Promise<void> {
    const histTimer = this._histoTransfersCmdHandlerMetric.startTimer()
    const evtname = message.msgName ?? 'unknown'
    try {
      this._logger.isInfoEnabled() && this._logger.info(`TransferCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
      let transferCmd: CommandMsg | undefined
      // Transform messages into correct Command
      switch (message.msgName) {
        case PrepareTransferCmd.name: {
          transferCmd = PrepareTransferCmd.fromIDomainMessage(message)
          break
        }
        case AckPayerFundsReservedCmd.name: {
          transferCmd = AckPayerFundsReservedCmd.fromIDomainMessage(message)
          break
        }
        case AckPayeeFundsCommittedCmd.name: {
          transferCmd = AckPayeeFundsCommittedCmd.fromIDomainMessage(message)
          break
        }
        case FulfilTransferCmd.name: {
          transferCmd = FulfilTransferCmd.fromIDomainMessage(message)
          break
        }
        default: {
          this._logger.isWarnEnabled() && this._logger.warn(`TransferCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
          break
        }
      }
      let processCommandResult: boolean = false
      if (transferCmd != null) {
        processCommandResult = await this._transfersAgg.processCommand(transferCmd)
      } else {
        this._logger.isWarnEnabled() && this._logger.warn('TransferCmdHandler - is Unable to process command')
      }
      this._logger.isInfoEnabled() && this._logger.info(`TransferCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: ${processCommandResult.toString()}`)
      histTimer({ success: 'true', evtname })
    } catch (err) {
      this._logger.isErrorEnabled() && this._logger.error(err)
      histTimer({ success: 'false', error: err.message, evtname })
    }
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
    await this._entityStateRepo.destroy()
    await this._duplicateRepo.destroy()
    // await this._eventSourcingRepo.destroy()
  }
}
