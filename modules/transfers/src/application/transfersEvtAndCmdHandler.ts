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
// import {InMemoryTransferStateRepo} from "../infrastructure/inmemory_transfer_repo";
import { DomainEventMsg, IDomainMessage, IMessagePublisher, ILogger, CommandMsg, IEntityDuplicateRepository } from '@mojaloop-poc/lib-domain'
import { MLTopics, ParticipantsTopics, PayerFundsReservedEvt, TransferPrepareRequestedEvt, TransferPrepareAcceptedEvt, TransferFulfilRequestedEvt, PayeeFundsCommittedEvt } from '@mojaloop-poc/lib-public-messages'
import {
  IRunHandler,
  MessageConsumer,
  // rdkafka imports
  RDKafkaCompressionTypes,
  RDKafkaProducerOptions,
  RDKafkaMessagePublisher,
  RDKafkaConsumerOptions,
  RDKafkaConsumer,
  // rdkafka batch imports
  RDKafkaConsumerBatched,
  RedisDuplicateInfraTypes,
  RedisDuplicateRepo,
  RedisDuplicateShardedRepo,
  InMemoryTransferDuplicateRepo
} from '@mojaloop-poc/lib-infrastructure'
import { AckPayerFundsReservedCmdPayload, AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { AckPayeeFundsCommittedCmdPayload, AckPayeeFundsCommittedCmd } from '../messages/ack_payee_funds_committed_cmd'
import { InvalidTransferEvtError } from './errors'
import { PrepareTransferCmdPayload, PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { FulfilTransferCmd, FulfilTransferCmdPayload } from '../messages/fulfil_transfer_cmd'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { v4 as uuidv4 } from 'uuid'
import { TransfersAgg } from '../domain/transfers_agg'
import { ITransfersRepo } from '../domain/transfers_repo'
import { CachedPersistedRedisTransferStateRepo } from '../infrastructure/cachedpersistedredis_transfer_repo'
import { InMemoryNodeCacheTransferStateRepo } from '../infrastructure/inmemory_node_cache_transfer_repo'
import { RepoInfraTypes } from '../infrastructure/index'
import { TransferState } from '../domain/transfer_entity'

export class TransferEvtAndCmdHandler implements IRunHandler {
  private _logger: ILogger
  private _clientId: string
  private _consumer: MessageConsumer
  private _consumerBatch: RDKafkaConsumerBatched
  private _publisher: IMessagePublisher

  private _entityStateRepo: ITransfersRepo
  private _duplicateRepo: IEntityDuplicateRepository
  private _transfersAgg: TransfersAgg

  private _histoTransfersEvtHandlerMetric: any
  private _histoTransfersEvtBatchHandlerMetric: any

  private _histoTransfersCmdHandlerMetric: any
  private _histoTransfersCmdBatchHandlerMetric: any

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler::start - appConfig=${JSON.stringify(appConfig)}`)

    this._clientId = `TransferEvtAndCmdHandler-${Crypto.randomBytes(8)}`

    // for now we update the metrics exactly the same way as before
    // (time take is no longer evt time + cmd time, as we now report the same for both, but counts will remain separate)

    // same names for both the evt handler metrics
    this._histoTransfersEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferEvtHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )
    this._histoTransfersEvtBatchHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferEvtHandlerBatch', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferEvtBatchHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    // same names for both the cmd handler metrics
    this._histoTransfersCmdHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferCmdHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferCmdHandler - time it takes for each command to be processed', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    this._histoTransfersCmdBatchHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferCmdHandlerBatch', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferCmdHandler - time it takes for batch of commands to be processed', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    await this._initPublisher(appConfig)

    await this._initDomain(appConfig)

    await this._initAndHookConsumer(appConfig)
    this._logger.isInfoEnabled() && this._logger.info('TransferEvtAndCmdHandler - init complete and ready to work')
  }

  private async _initPublisher (appConfig: any): Promise<void> {
    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    this._logger.isInfoEnabled() && this._logger.info(`Creating ${appConfig.kafka.producer} TransferEvtAndCmdHandler.kafkaMsgPublisher...`)

    const rdKafkaProducerOptions: RDKafkaProducerOptions = {
      client: {
        producerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          dr_cb: true,
          'client.id': this._clientId,
          'socket.keepalive.enable': true,
          'compression.codec': appConfig.kafka.gzipCompression === true ? RDKafkaCompressionTypes.GZIP : RDKafkaCompressionTypes.NONE
        },
        topicConfig: {
          // partitioner: RDKafkaPartioner.MURMUR2_RANDOM // default java algorithm, seems to have worse random distribution for hashing than rdkafka's default
        }
      }
    }
    this._publisher = new RDKafkaMessagePublisher(rdKafkaProducerOptions, this._logger)
    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - Created kafkaMsgPublisher of type ${this._publisher.constructor.name}`)
    await this._publisher.init()
    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - Initialised kafkaMsgPublisher of type ${this._publisher.constructor.name}`)
  }

  private async _initAndHookConsumer (appConfig: any): Promise<void> {
    let transferEvtConsumer: MessageConsumer | undefined
    let transferEvtBatchConsumer: RDKafkaConsumerBatched | undefined

    if (appConfig.batch.enabled === true) {
      this._logger.isInfoEnabled() && this._logger.info('TransferEvtAndCmdHandler - Creating RDKafkaConsumerBatched consumer...')
    } else {
      this._logger.isInfoEnabled() && this._logger.info('TransferEvtAndCmdHandler - Creating RDKafkaConsumer consumer...')
    }

    const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
      client: {
        consumerConfig: {
          'metadata.broker.list': appConfig.kafka.host,
          'group.id': 'transferEvtGroup',
          'enable.auto.commit': appConfig.kafka.autocommit,
          'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
          'client.id': this._clientId,
          'socket.keepalive.enable': true,
          'fetch.min.bytes': appConfig.kafka.fetchMinBytes,
          'fetch.wait.max.ms': appConfig.kafka.fetchWaitMaxMs,
          'enable.partition.eof': true
        },
        topicConfig: {},
        rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
      },
      topics: [MLTopics.Events, ParticipantsTopics.DomainEvents]
    }

    if (appConfig.batch.enabled === true) {
      transferEvtBatchConsumer = new RDKafkaConsumerBatched(rdKafkaConsumerOptions, this._logger)
      this._logger.isInfoEnabled() && this._logger.info('TransferEvtAndCmdHandler - Created kafkaConsumer evt of type RDKafkaConsumerBatched')
    } else {
      transferEvtConsumer = new RDKafkaConsumer(rdKafkaConsumerOptions, this._logger)
      this._logger.isInfoEnabled() && this._logger.info('TransferEvtAndCmdHandler - Created kafkaConsumer evt of type RDKafkaConsumer')
    }

    const subscribedMsgNames = [
      'PayerFundsReservedEvt',
      'PayeeFundsCommittedEvt',
      'TransferPrepareRequestedEvt',
      'TransferFulfilRequestedEvt'
    ]

    this._logger.isInfoEnabled() && this._logger.info('TransferEvtAndCmdHandler - Initializing transfer evt consumer...')
    if (appConfig.batch.enabled === true) {
      if (transferEvtBatchConsumer === undefined) {
        const err = new Error('transferEvtBatchConsumer is undefined')
        this._logger.isErrorEnabled() && this._logger.error(err)
        throw err
      }
      this._consumerBatch = transferEvtBatchConsumer
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      await transferEvtBatchConsumer.init(this._evtBatchHandler.bind(this), subscribedMsgNames)
    } else {
      if (transferEvtConsumer === undefined) {
        const err = new Error('transferEvtConsumer is undefined')
        this._logger.isErrorEnabled() && this._logger.error(err)
        throw err
      }
      this._consumer = transferEvtConsumer
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      await transferEvtConsumer.init(this._evtHandler.bind(this), subscribedMsgNames)
    }
  }

  private async _initDomain (appConfig: any): Promise<void> {
    // logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Creating Statecache-repo of type ${appConfig.state_cache.type as string}`)
    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - Creating Statecache-repo of type ${appConfig.entity_state.type as string}`)
    // switch (appConfig.state_cache.type) {
    switch (appConfig.entity_state.type) {
      case RepoInfraTypes.CACHEDPERSISTEDREDIS: {
        this._entityStateRepo = new CachedPersistedRedisTransferStateRepo(appConfig.entity_state.host, appConfig.entity_state.clustered, this._logger, appConfig.entity_state.expirationInSeconds)
        break
      }
      case RepoInfraTypes.NODECACHE: {
        this._entityStateRepo = new InMemoryNodeCacheTransferStateRepo(this._logger, appConfig.entity_state.expirationInSeconds)
        break
      }
      default: { // defaulting to In-Memory
        this._entityStateRepo = new InMemoryNodeCacheTransferStateRepo(this._logger, appConfig.entity_state.expirationInSeconds)
      }
    }
    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - Created Statecache-repo of type ${this._entityStateRepo.constructor.name}`)

    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - Creating Duplicate-repo of type ${appConfig.duplicate_store.type as string}`)
    switch (appConfig.duplicate_store.type) {
      case RedisDuplicateInfraTypes.REDIS: {
        this._duplicateRepo = new RedisDuplicateRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'transfers_duplicate', this._logger)
        break
      }
      case RedisDuplicateInfraTypes.REDIS_SHARDED: {
        this._duplicateRepo = new RedisDuplicateShardedRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'transfers_duplicate', this._logger, true)
        break
      }
      case RedisDuplicateInfraTypes.MEMORY: {
        this._duplicateRepo = new InMemoryTransferDuplicateRepo()
        break
      }
      default: {
        this._duplicateRepo = new RedisDuplicateRepo(appConfig.duplicate_store.host, appConfig.duplicate_store.clustered, 'transfers_duplicate', this._logger)
      }
    }
    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - Created Duplicate-repo of type ${this._duplicateRepo.constructor.name}`)

    await this._entityStateRepo.init()
    await this._duplicateRepo.init()
    // await this._eventSourcingRepo.init()
    await this._publisher.init()

    // this._transfersAgg = new TransfersAgg(this._entityStateRepo, this._duplicateRepo, this._eventSourcingRepo, this._publisher, this._logger)
    this._transfersAgg = new TransfersAgg(this._entityStateRepo, this._duplicateRepo, this._publisher, this._logger)

    // batched mode
    if (appConfig.batch.enabled === true) this._transfersAgg.enableBatchMode()
  }

  private async _evtHandler (message: IDomainMessage): Promise<void> {
    const histEvtTimer = this._histoTransfersEvtHandlerMetric.startTimer()
    const histCmdTimer = this._histoTransfersCmdHandlerMetric.startTimer()
    const evtname = message.msgName ?? 'unknown'
    try {
      this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
      // # Transform messages into correct Command
      const transferCmd: CommandMsg | undefined = this._getCommandMsgFromEventMsg(message)

      if (transferCmd != null) {
        this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - processing cmd: ${transferCmd?.msgName}:${transferCmd?.msgId}`)
        const processCommandResult: boolean = await this._transfersAgg.processCommand(transferCmd)
        this._logger.isInfoEnabled() && this._logger.info(`TransferEvtAndCmdHandler - processing cmd finished - ${transferCmd?.msgName}:${transferCmd?.msgKey}:${transferCmd?.msgId} - Result: ${processCommandResult.toString()}`)
        histCmdTimer({ success: processCommandResult.toString(), evtname })
        histEvtTimer({ success: processCommandResult.toString(), evtname })
      } else {
        histCmdTimer({ success: 'false', evtname })
        histEvtTimer({ success: 'false', evtname })
      }
    } catch (err) {
      const errMsg: string = err?.message?.toString()
      this._logger.isWarnEnabled() && this._logger.warn(`TransferEvtAndCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histEvtTimer({ success: 'false', error: err.message, evtname })
      histCmdTimer({ success: 'false', error: err.message, evtname })
    }
  }

  private async _evtBatchHandler (eventMessages: IDomainMessage[]): Promise<void> {
    const startTs = Date.now()
    const histEvtTimerBatches = this._histoTransfersEvtBatchHandlerMetric.startTimer()
    const histCmdTimerBatches = this._histoTransfersCmdBatchHandlerMetric.startTimer()

    const batchId: string = this._transfersAgg.startBatch()
    this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - processing events - batchId: ${batchId} - length:${eventMessages?.length} - Start`)

    // const commands: IDomainMessage[] = []

    try {
      for (const eventMessage of eventMessages) {
        const histEvtTimer = this._histoTransfersEvtHandlerMetric.startTimer()
        const histCmdTimer = this._histoTransfersCmdHandlerMetric.startTimer()
        try {
          this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - getting command for event - ${eventMessage?.msgName}:${eventMessage?.msgKey}:${eventMessage?.msgId}`)
          const transferCmd: CommandMsg | undefined = this._getCommandMsgFromEventMsg(eventMessage)

          if (transferCmd !== undefined) {
            histEvtTimer({ success: 'true', evtname: eventMessage.msgName ?? 'unknown' })
            //  commands.push(transferCmd)
            this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - processing cmd: ${transferCmd?.msgName}:${transferCmd?.msgId}`)
            const processCommandResult: boolean = await this._transfersAgg.processCommand(transferCmd)
            if (processCommandResult) {
              this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - processing cmd finished - ${transferCmd?.msgName}:${transferCmd?.msgKey}:${transferCmd?.msgId} - Result: ${processCommandResult.toString()}`)
            } else {
              this._logger.isWarnEnabled() && this._logger.warn(`TransferEvtAndCmdHandler (batched) - processing cmd finished - ${transferCmd?.msgName}:${transferCmd?.msgKey}:${transferCmd?.msgId} - Result: ${processCommandResult.toString()}`)
            }
            histCmdTimer({ success: 'true', evtname: transferCmd?.msgName ?? 'unknown' })
          } else {
            this._logger.isWarnEnabled() && this._logger.warn('TransferEvtAndCmdHandler (batched) - could not get CommandMsg from EventMsg')
            histEvtTimer({ success: 'true', evtname: eventMessage.msgName ?? 'unknown' })
          }
          this._logger.isDebugEnabled() && this._logger.debug('') // blank debug line to facilitate log analysis
        } catch (err) {
          const errMsg: string = err?.message?.toString()
          this._logger.isWarnEnabled() && this._logger.warn(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - processing event - ${eventMessage?.msgName}:${eventMessage?.msgKey}:${eventMessage?.msgId} - Error: ${errMsg}`)
          this._logger.isErrorEnabled() && this._logger.error(err)
          histEvtTimer({ success: 'false', evtname: eventMessage.msgName ?? 'unknown' })
          histCmdTimer({ success: 'false', evtname: 'unknown' })
          throw err
        }
      }
    } catch (err) {
      // TODO: Handle something here?
      this._logger.isErrorEnabled() && this._logger.error(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - failed`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histEvtTimerBatches({ success: 'false' })
      histCmdTimerBatches({ success: 'false' })
      throw err
    }

    const unpersistedStates: TransferState[] = this._transfersAgg.getUnpersistedEntityStates()
    const uncommitedEvents: IDomainMessage[] = this._transfersAgg.getUncommitedDomainEvents()

    if (unpersistedStates?.length > 0) {
      this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - peristing ${unpersistedStates.length} states`)

      // don't use storeMany for just one
      if (unpersistedStates.length === 1) {
        await this._entityStateRepo.store(unpersistedStates[0])
      } else {
        await this._entityStateRepo.storeMany(unpersistedStates)
      }
    } else {
      this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - no unpersisted states at _cmdHandler batch end`)
    }

    if (uncommitedEvents?.length > 0) {
      this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - publishing ${uncommitedEvents.length} domain event(s)`)
      await this._publisher.publishMany(uncommitedEvents)
    } else {
      this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - no domain events to publish at _cmdHandler batch end`)
    }

    // for (const evtMessage of eventMessages) {
    //   histEvtTimer({ success: 'true', evtname: evtMessage.msgName ?? 'unknown' })
    // }
    // for (const cmdMessage of commands) {
    //   histCmdTimer({ success: 'true', evtname: cmdMessage.msgName ?? 'unknown' })
    // }

    this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - finished`)
    histEvtTimerBatches({ success: 'true' })
    histCmdTimerBatches({ success: 'true' })
    this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtAndCmdHandler (batched) - batchId: ${batchId} - batch took: ${Date.now() - startTs} ms`)
    this._logger.isDebugEnabled() && this._logger.debug('') // blank debug line to facilitate log analysis
    this._logger.isDebugEnabled() && this._logger.debug('') // blank debug line to facilitate log analysis
  }

  private _getCommandMsgFromEventMsg (message: IDomainMessage): CommandMsg | undefined {
    let transferEvt: DomainEventMsg | undefined
    let transferCmd: CommandMsg | undefined
    // # Transform messages into correct Command
    switch (message.msgName) {
      case PayerFundsReservedEvt.name: {
        transferEvt = PayerFundsReservedEvt.fromIDomainMessage(message)
        if (transferEvt == null) throw new InvalidTransferEvtError(`transferEvtBatchHandler - is unable to process event - ${PayerFundsReservedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
        const ackPayerFundsReservedCmdPayload: AckPayerFundsReservedCmdPayload = transferEvt.payload
        transferCmd = new AckPayerFundsReservedCmd(ackPayerFundsReservedCmdPayload)
        transferCmd.passTraceInfo(transferEvt)
        break
      }
      case PayeeFundsCommittedEvt.name: {
        transferEvt = PayeeFundsCommittedEvt.fromIDomainMessage(message)
        if (transferEvt == null) throw new InvalidTransferEvtError(`transferEvtBatchHandler - is unable to process event - ${PayeeFundsCommittedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
        const ackPayeeFundsCommittedCmdPayload: AckPayeeFundsCommittedCmdPayload = transferEvt.payload
        transferCmd = new AckPayeeFundsCommittedCmd(ackPayeeFundsCommittedCmdPayload)
        transferCmd.passTraceInfo(transferEvt)
        break
      }
      case TransferPrepareRequestedEvt.name: {
        transferEvt = TransferPrepareRequestedEvt.fromIDomainMessage(message)
        if (transferEvt == null) throw new InvalidTransferEvtError(`transferEvtBatchHandler - is unable to process event - ${TransferPrepareRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
        const prepareTransferCmdPayload: PrepareTransferCmdPayload = transferEvt.payload
        transferCmd = new PrepareTransferCmd(prepareTransferCmdPayload)
        transferCmd.passTraceInfo(transferEvt)
        break
      }
      case TransferFulfilRequestedEvt.name: {
        transferEvt = TransferFulfilRequestedEvt.fromIDomainMessage(message)
        if (transferEvt == null) throw new InvalidTransferEvtError(`transferEvtBatchHandler - is unable to process event - ${TransferFulfilRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
        const fulfilTransferCmdPayload: FulfilTransferCmdPayload = transferEvt.payload
        transferCmd = new FulfilTransferCmd(fulfilTransferCmdPayload)
        transferCmd.passTraceInfo(transferEvt)
        break
      }
      case TransferPrepareAcceptedEvt.name: {
        // this._logger.isInfoEnabled() && this._logger.info(`EVENT:Type TransferPrepareAcceptedEvt ignored for now... TODO: refactor the topic names`)
        break
      }
      default: {
        this._logger.isDebugEnabled() && this._logger.debug(`transferEvtBatchHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
      }
    }
    return transferCmd
  }

  async destroy (): Promise<void> {
    if (this._consumer !== undefined) await this._consumer.destroy(true)
    if (this._consumerBatch !== undefined) await this._consumerBatch.destroy(true)
    await this._publisher.destroy()
  }
}
