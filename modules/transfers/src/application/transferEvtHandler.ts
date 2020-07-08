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
  EnumOffset,
  IRunHandler,
  KafkaInfraTypes,
  KafkaMessagePublisher,
  MessageConsumer,
  // node-kafka imports
  KafkaGenericConsumer, KafkaGenericConsumerOptions, KafkaGenericProducerOptions, KafkaNodeCompressionTypes,
  // node-kafka-stream imports
  KafkaStreamConsumer,
  // kafkajs imports
  KafkaJsCompressionTypes, KafkaJsConsumer, KafkaJsConsumerOptions, KafkajsMessagePublisher, KafkaJsProducerOptions,
  // rdkafka imports
  RDKafkaCompressionTypes, RDKafkaProducerOptions, RDKafkaMessagePublisher, RDKafkaConsumerOptions, RDKafkaConsumer
} from '@mojaloop-poc/lib-infrastructure'
import { AckPayerFundsReservedCmdPayload, AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { AckPayeeFundsCommittedCmdPayload, AckPayeeFundsCommittedCmd } from '../messages/ack_payee_funds_committed_cmd'
import { InvalidTransferEvtError } from './errors'
import { PrepareTransferCmdPayload, PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { FulfilTransferCmd, FulfilTransferCmdPayload } from '../messages/fulfil_transfer_cmd'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'

export class TransferEvtHandler implements IRunHandler {
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    logger.info(`TransferEvtHandler::start - appConfig=${JSON.stringify(appConfig)}`)
    let kafkaMsgPublisher: IMessagePublisher | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`Creating ${appConfig.kafka.producer} transferEvtHandler.kafkaMsgPublisher...`)
    let clientId = `transferEvtHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.producer) {
      case (KafkaInfraTypes.NODE_KAFKA_STREAM):
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId
            },
            compression: appConfig.kafka.gzipCompression === true ? KafkaNodeCompressionTypes.GZIP : KafkaNodeCompressionTypes.None
          }
        }
        kafkaMsgPublisher = new KafkaMessagePublisher(
          kafkaGenericProducerOptions,
          logger
        )
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsProducerOptions: KafkaJsProducerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: [appConfig.kafka.host],
              clientId
            },
            producer: { // https://kafka.js.org/docs/producing#options
              allowAutoTopicCreation: true,
              transactionTimeout: 60000
            },
            compression: appConfig.kafka.gzipCompression as boolean ? KafkaJsCompressionTypes.GZIP : KafkaJsCompressionTypes.None
          }
        }
        kafkaMsgPublisher = new KafkajsMessagePublisher(
          kafkaJsProducerOptions,
          logger
        )
        break
      }
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
        logger.warn('TransferEvtConsumer - Unable to find a Kafka Producer implementation!')
        throw new Error('transferEvtHandler.kafkaMsgPublisher was not created!')
      }
    }

    logger.info(`TransferEvtConsumer - Created kafkaMsgPublisher of type ${kafkaMsgPublisher.constructor.name}`)

    this._publisher = kafkaMsgPublisher
    await kafkaMsgPublisher.init()

    const histoTransferEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferEvtHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    const transferEvtHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoTransferEvtHandlerMetric.startTimer()
      const evtname = message.msgName ?? 'unknown'
      try {
        logger.info(`TransferEvtConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
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
            // logger.info(`EVENT:Type TransferPrepareAcceptedEvt ignored for now... TODO: refactor the topic names`)
            break
          }
          default: {
            logger.debug(`TransferEvtConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            histTimer({ success: 'true', evtname })
            return
          }
        }

        if (transferCmd != null) {
          logger.info(`TransferEvtConsumer - publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${transferCmd?.msgName}:${transferCmd?.msgId}`)
          await kafkaMsgPublisher!.publish(transferCmd)
          logger.info(`TransferEvtConsumer - publishing cmd Finished - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
        }
        histTimer({ success: 'true', evtname })
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.warn(`TransferEvtConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.error(err)
        histTimer({ success: 'false', error: err.message, evtname })
      }
    }

    let transferEvtConsumer: MessageConsumer | undefined

    logger.info(`TransferEvtConsumer - Creating ${appConfig.kafka.consumer as string} transferEvtConsumer...`)
    clientId = `transferEvtConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const transferEvtConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'transferEvtGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [MLTopics.Events, ParticipantsTopics.DomainEvents]
        }
        transferEvtConsumer = new KafkaGenericConsumer(transferEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_KAFKA_STREAM): {
        const transferEvtConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'transferEvtGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [MLTopics.Events, ParticipantsTopics.DomainEvents]
        }
        transferEvtConsumer = new KafkaStreamConsumer(transferEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: [appConfig.kafka.host],
              clientId
            },
            consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
              groupId: 'transferEvtGroup'
            },
            consumerRunConfig: {
              autoCommit: appConfig.kafka.autocommit,
              autoCommitInterval: appConfig.kafka.autoCommitInterval,
              autoCommitThreshold: appConfig.kafka.autoCommitThreshold
            }
          },
          topics: [MLTopics.Events, ParticipantsTopics.DomainEvents]
        }
        transferEvtConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
          client: {
            consumerConfig: {
              'metadata.broker.list': appConfig.kafka.host,
              'group.id': 'transferEvtGroup',
              'enable.auto.commit': appConfig.kafka.autocommit,
              'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
              'client.id': clientId,
              'socket.keepalive.enable': true
            },
            topicConfig: {},
            rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
          },
          topics: [MLTopics.Events, ParticipantsTopics.DomainEvents]
        }
        transferEvtConsumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
        break
      }
      default: {
        logger.warn('TransferEvtConsumer - Unable to find a Kafka consumer implementation!')
        throw new Error('transferEvtConsumer was not created!')
      }
    }
    logger.info(`TransferEvtConsumer - Created kafkaConsumer of type ${transferEvtConsumer.constructor.name}`)

    this._consumer = transferEvtConsumer
    logger.info('TransferEvtConsumer - Initializing transferCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await transferEvtConsumer.init(transferEvtHandler)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
  }
}
