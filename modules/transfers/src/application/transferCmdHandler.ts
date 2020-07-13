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
import { CommandMsg, IDomainMessage, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
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
// import { InMemoryTransferStateRepo } from '../infrastructure/inmemory_transfer_repo'
// import { TransferState } from '../domain/transfer_entity'
import { TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import { TransfersAgg } from '../domain/transfers_agg'
import { PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { RedisTransferStateRepo } from '../infrastructure/redis_transfer_repo'
import { RedisTransferDuplicateRepo } from '../infrastructure/redis_duplicate_repo'
import { ITransfersRepo } from '../domain/transfers_repo'
import { FulfilTransferCmd } from '../messages/fulfil_transfer_cmd'
import { AckPayeeFundsCommittedCmd } from '../messages/ack_payee_funds_committed_cmd'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { IDupTransferRepo } from '../domain/transfers_duplicate_repo'

export class TransferCmdHandler implements IRunHandler {
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher
  private _stateRepo: ITransfersRepo
  private readonly _duplicateRepo: IDupTransferRepo

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    logger.isInfoEnabled() && logger.info(`TransferCmdHandler::start - appConfig=${JSON.stringify(appConfig)}`)
    // const repo: IEntityStateRepository<TransferState> = new InMemoryTransferStateRepo()
    const stateRepo: ITransfersRepo = new RedisTransferStateRepo(appConfig.redis.host, logger, appConfig.redis.expirationInSeconds)
    // https://hur.st/bloomfilter/?n=100000000&p=1.0E-7&m=&k=
    const duplicateRepo: IDupTransferRepo = new RedisTransferDuplicateRepo(appConfig.duplicate.host, logger)
    this._stateRepo = stateRepo
    await stateRepo.init()
    await duplicateRepo.init()

    let kafkaMsgPublisher: IMessagePublisher | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Creating ${appConfig.kafka.producer} transferCmdHandler.kafkaMsgPublisher...`)
    let clientId = `transferCmdHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
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
        logger.isWarnEnabled() && logger.warn('TransferCmdHandler - Unable to find a Kafka Producer implementation!')
        throw new Error('transferCmdHandler.kafkaMsgPublisher was not created!')
      }
    }

    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Created kafkaMsgPublisher of type ${kafkaMsgPublisher.constructor.name}`)

    this._publisher = kafkaMsgPublisher
    await kafkaMsgPublisher.init()

    const agg: TransfersAgg = new TransfersAgg(stateRepo, duplicateRepo, kafkaMsgPublisher, logger)

    const histoTransferCmdHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'transferCmdHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for transferCmdHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    // ## Setup transferCmdConsumer
    const transferCmdHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoTransferCmdHandlerMetric.startTimer()
      const evtname = message.msgName ?? 'unknown'
      try {
        logger.isInfoEnabled() && logger.info(`TransferCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
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
            logger.isWarnEnabled() && logger.warn(`TransferCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            break
          }
        }
        let processCommandResult: boolean = false
        if (transferCmd != null) {
          processCommandResult = await agg.processCommand(transferCmd)
        } else {
          logger.isWarnEnabled() && logger.warn('TransferCmdHandler - is Unable to process command')
        }
        logger.isInfoEnabled() && logger.info(`TransferCmdHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: ${processCommandResult.toString()}`)
        histTimer({ success: 'true', evtname })
      } catch (err) {
        logger.isErrorEnabled() && logger.error(err)
        histTimer({ success: 'false', error: err.message, evtname })
      }
    }

    let transferCmdConsumer: MessageConsumer | undefined

    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Creating ${appConfig.kafka.consumer as string} transferCmdConsumer...`)
    clientId = `transferCmdConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const transferCmdConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'transferCmdGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [TransfersTopics.Commands]
        }
        transferCmdConsumer = new KafkaGenericConsumer(transferCmdConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_KAFKA_STREAM): {
        const transferCmdConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'transferCmdGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [TransfersTopics.Commands]
        }
        transferCmdConsumer = new KafkaStreamConsumer(transferCmdConsumerOptions, logger)
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
              groupId: 'transferCmdGroup'
            },
            consumerRunConfig: {
              autoCommit: appConfig.kafka.autocommit,
              autoCommitInterval: appConfig.kafka.autoCommitInterval,
              autoCommitThreshold: appConfig.kafka.autoCommitThreshold
            }
          },
          topics: [TransfersTopics.Commands]
        }
        transferCmdConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
          client: {
            consumerConfig: {
              'metadata.broker.list': appConfig.kafka.host,
              'group.id': 'transferCmdGroup',
              'enable.auto.commit': appConfig.kafka.autocommit,
              'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
              'client.id': clientId,
              'socket.keepalive.enable': true
            },
            topicConfig: {},
            rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
          },
          topics: [TransfersTopics.Commands]
        }
        transferCmdConsumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
        break
      }
      default: {
        logger.isWarnEnabled() && logger.warn('TransferCmdHandler - Unable to find a Kafka consumer implementation!')
        throw new Error('transferCmdConsumer was not created!')
      }
    }

    logger.isInfoEnabled() && logger.info(`TransferCmdHandler - Created kafkaConsumer of type ${transferCmdConsumer.constructor.name}`)

    this._consumer = transferCmdConsumer

    logger.isInfoEnabled() && logger.info('TransferCmdHandler - Initializing transferCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await transferCmdConsumer.init(transferCmdHandler)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
    await this._stateRepo.destroy()
    await this._duplicateRepo.destroy()
  }
}
