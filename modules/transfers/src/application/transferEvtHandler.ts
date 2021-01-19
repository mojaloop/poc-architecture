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
import { DomainEventMsg, IDomainMessage, IMessagePublisher, ILogger, CommandMsg } from '@mojaloop-poc/lib-domain'
import { MLTopics, ParticipantsTopics, PayerFundsReservedEvt, TransferPrepareRequestedEvt, TransferPrepareAcceptedEvt, TransferFulfilRequestedEvt, PayeeFundsCommittedEvt } from '@mojaloop-poc/lib-public-messages'
import {
  IRunHandler,
  KafkaInfraTypes,
  MessageConsumer,
  // rdkafka imports
  RDKafkaCompressionTypes, RDKafkaProducerOptions, RDKafkaMessagePublisher, RDKafkaConsumerOptions, RDKafkaConsumer,
  // rdkafka batch imports
  RDKafkaConsumerBatched
} from '@mojaloop-poc/lib-infrastructure'
import { AckPayerFundsReservedCmdPayload, AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { AckPayeeFundsCommittedCmdPayload, AckPayeeFundsCommittedCmd } from '../messages/ack_payee_funds_committed_cmd'
import { InvalidTransferEvtError } from './errors'
import { PrepareTransferCmdPayload, PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { FulfilTransferCmd, FulfilTransferCmdPayload } from '../messages/fulfil_transfer_cmd'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { v4 as uuidv4 } from 'uuid'

export class TransferEvtHandler implements IRunHandler {
  private _logger: ILogger
  private _consumer: MessageConsumer
  private _consumerBatch: RDKafkaConsumerBatched
  private _publisher: IMessagePublisher
  private _histoTransferEvtHandlerMetric: any
  private _histoTransferEvtBatchHandlerMetric: any

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtHandler::start - appConfig=${JSON.stringify(appConfig)}`)
    let kafkaMsgPublisher: IMessagePublisher | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    this._logger.isInfoEnabled() && this._logger.info(`Creating ${appConfig.kafka.producer} transferEvtHandler.kafkaMsgPublisher...`)
    let clientId = `transferEvtHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.producer) {
      case (KafkaInfraTypes.NODE_RDKAFKA): {
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
        kafkaMsgPublisher = new RDKafkaMessagePublisher(
          rdKafkaProducerOptions,
          logger
        )
        break
      }
      default: {
        this._logger.isWarnEnabled() && this._logger.warn('TransferEvtConsumer - Unable to find a Kafka Producer implementation!')
        throw new Error('transferEvtHandler.kafkaMsgPublisher was not created!')
      }
    }

    this._logger.isInfoEnabled() && this._logger.info(`TransferEvtConsumer - Created kafkaMsgPublisher of type ${kafkaMsgPublisher.constructor.name}`)

    this._publisher = kafkaMsgPublisher
    await this._publisher.init()

    this._histoTransferEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferEvtHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    this._histoTransferEvtBatchHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferEvtHandlerBatch', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferEvtBatchHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    let transferEvtConsumer: MessageConsumer | undefined
    let transferEvtBatchConsumer: RDKafkaConsumerBatched | undefined

    if (appConfig.batch.enabled === true) {
      this._logger.isInfoEnabled() && this._logger.info(`TransferEvtHandler - Creating ${appConfig.kafka.consumer as string} transferEvtBatchConsumer...`)
      clientId = `transferEvtBatchConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`
    } else {
      this._logger.isInfoEnabled() && this._logger.info(`TransferEvtHandler - Creating ${appConfig.kafka.consumer as string} transferEvtConsumer...`)
      clientId = `transferEvtConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`
    }

    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
          client: {
            consumerConfig: {
              'metadata.broker.list': appConfig.kafka.host,
              'group.id': 'transferEvtGroup',
              'enable.auto.commit': appConfig.kafka.autocommit,
              'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
              'client.id': clientId,
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
          transferEvtBatchConsumer = new RDKafkaConsumerBatched(rdKafkaConsumerOptions, logger)
          this._logger.isInfoEnabled() && this._logger.info('TransferEvtHandler - Created kafkaConsumer of type RDKafkaConsumerBatched')
        } else {
          transferEvtConsumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
          this._logger.isInfoEnabled() && this._logger.info('TransferEvtHandler - Created kafkaConsumer of type RDKafkaConsumer')
        }

        break
      }
      default: {
        this._logger.isWarnEnabled() && this._logger.warn('TransferEvtHandler - Unable to find a Kafka consumer implementation!')
        throw new Error('transferEvtConsumer was not created!')
      }
    }

    const subscribedMsgNames = [
      'PayerFundsReservedEvt',
      'PayeeFundsCommittedEvt',
      'TransferPrepareRequestedEvt',
      'TransferFulfilRequestedEvt'
    ]

    this._logger.isInfoEnabled() && this._logger.info('TransferEvtHandler - Initializing transferCmdConsumer...')
    if (appConfig.batch.enabled === true) {
      if (transferEvtBatchConsumer === undefined) {
        const err = new Error('transferEvtBatchConsumer is undefined')
        this._logger.isErrorEnabled() && this._logger.error(err)
        throw err
      }
      this._consumerBatch = transferEvtBatchConsumer
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      await transferEvtBatchConsumer.init(this._transferEvtBatchHandler.bind(this), subscribedMsgNames)
    } else {
      if (transferEvtConsumer === undefined) {
        const err = new Error('transferEvtConsumer is undefined')
        this._logger.isErrorEnabled() && this._logger.error(err)
        throw err
      }
      this._consumer = transferEvtConsumer
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      await transferEvtConsumer.init(this._transferEvtHandler.bind(this), subscribedMsgNames)
    }
  }

  private async _transferEvtHandler (message: IDomainMessage): Promise<void> {
    const histTimer = this._histoTransferEvtHandlerMetric.startTimer()
    const evtname = message.msgName ?? 'unknown'
    try {
      this._logger.isInfoEnabled() && this._logger.info(`TransferEvtConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
      let transferEvt: DomainEventMsg | undefined
      let transferCmd: CommandMsg | null = null
      // # Transform messages into correct Command
      switch (message.msgName) {
        case PayerFundsReservedEvt.name: {
          transferEvt = PayerFundsReservedEvt.fromIDomainMessage(message)
          if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${PayerFundsReservedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          const ackPayerFundsReservedCmdPayload: AckPayerFundsReservedCmdPayload = transferEvt.payload
          transferCmd = new AckPayerFundsReservedCmd(ackPayerFundsReservedCmdPayload)
          transferCmd.passTraceInfo(transferEvt)
          break
        }
        case PayeeFundsCommittedEvt.name: {
          transferEvt = PayeeFundsCommittedEvt.fromIDomainMessage(message)
          if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${PayeeFundsCommittedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          const ackPayeeFundsCommittedCmdPayload: AckPayeeFundsCommittedCmdPayload = transferEvt.payload
          transferCmd = new AckPayeeFundsCommittedCmd(ackPayeeFundsCommittedCmdPayload)
          transferCmd.passTraceInfo(transferEvt)
          break
        }
        case TransferPrepareRequestedEvt.name: {
          transferEvt = TransferPrepareRequestedEvt.fromIDomainMessage(message)
          if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${TransferPrepareRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          const prepareTransferCmdPayload: PrepareTransferCmdPayload = transferEvt.payload
          transferCmd = new PrepareTransferCmd(prepareTransferCmdPayload)
          transferCmd.passTraceInfo(transferEvt)
          break
        }
        case TransferFulfilRequestedEvt.name: {
          transferEvt = TransferFulfilRequestedEvt.fromIDomainMessage(message)
          if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${TransferFulfilRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
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
          this._logger.isDebugEnabled() && this._logger.debug(`TransferEvtConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
          histTimer({ success: 'true', evtname })
          return
        }
      }

      if (transferCmd != null) {
        this._logger.isInfoEnabled() && this._logger.info(`TransferEvtConsumer - publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${transferCmd?.msgName}:${transferCmd?.msgId}`)
        await this._publisher.publish(transferCmd)
        this._logger.isInfoEnabled() && this._logger.info(`TransferEvtConsumer - publishing cmd Finished - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
      }
      histTimer({ success: 'true', evtname })
    } catch (err) {
      const errMsg: string = err?.message?.toString()
      this._logger.isWarnEnabled() && this._logger.warn(`TransferEvtConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histTimer({ success: 'false', error: err.message, evtname })
    }
  }

  private async _transferEvtBatchHandler (messages: IDomainMessage[]): Promise<void> {
    const histTimer = this._histoTransferEvtHandlerMetric.startTimer()
    const histTimerBatches = this._histoTransferEvtBatchHandlerMetric.startTimer()
    const batchId = uuidv4()
    this._logger.isInfoEnabled() && this._logger.info(`transferEvtBatchHandler - processing events - batchId: ${batchId} - length:${messages?.length} - Start`)

    const commands: IDomainMessage[] = []

    try {
      for (const message of messages) {
        // const evtname = message.msgName ?? 'unknown'
        try {
          this._logger.isInfoEnabled() && this._logger.info(`transferEvtBatchHandler - batchId: ${batchId} - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          const transferCmd: CommandMsg | undefined = this._getCommandFromEventMsg(message)

          if (transferCmd !== undefined) {
            this._logger.isInfoEnabled() && this._logger.info(`transferEvtBatchHandler - batchId: ${batchId} - publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${transferCmd?.msgName}:${transferCmd?.msgId}`)
            commands.push(transferCmd)
            this._logger.isInfoEnabled() && this._logger.info(`transferEvtBatchHandler - batchId: ${batchId} - publishing cmd Finished - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
          }
        } catch (err) {
          const errMsg: string = err?.message?.toString()
          this._logger.isWarnEnabled() && this._logger.warn(`transferEvtBatchHandler - batchId: ${batchId} - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
          this._logger.isErrorEnabled() && this._logger.error(err)
          throw err
        }
      }
    } catch (err) {
      // TODO: Handle something here?
      this._logger.isErrorEnabled() && this._logger.error(`transferEvtBatchHandler - batchId: ${batchId} - failed`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histTimerBatches({ success: 'false' })
      throw err
    }
    if (commands != null && commands.length > 0) {
      this._logger.isInfoEnabled() && this._logger.info(`transferEvtBatchHandler - batchId: ${batchId} - publishing cmd list - length:${commands?.length}`)
      await this._publisher.publishMany(commands)
      this._logger.isInfoEnabled() && this._logger.info(`transferEvtBatchHandler - batchId: ${batchId} - publishing cmd Finished`)

      for (const message of messages) {
        histTimer({ success: 'true', evtname: message.msgName ?? 'unknown' })
      }
    } else {
      this._logger.isDebugEnabled() && this._logger.debug(`transferEvtBatchHandler - batchId: ${batchId} - No commands processed.`)
    }

    histTimerBatches({ success: 'true' })
  }

  private _getCommandFromEventMsg (message: IDomainMessage): CommandMsg | undefined {
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
