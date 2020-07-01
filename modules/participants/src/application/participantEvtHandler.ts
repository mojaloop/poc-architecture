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
import { DomainEventMsg, IDomainMessage, IMessagePublisher, ILogger, CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransferPrepareAcceptedEvt, TransferFulfilAcceptedEvt, TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import {
  IRunHandler,
  KafkaInfraTypes,
  KafkaJsProducerOptions,
  KafkajsMessagePublisher,
  KafkaJsConsumer,
  KafkaJsConsumerOptions,
  MessageConsumer,
  KafkaMessagePublisher,
  KafkaGenericConsumer,
  EnumOffset,
  KafkaGenericConsumerOptions,
  KafkaGenericProducerOptions,
  KafkaJsCompressionTypes,
  KafkaStreamConsumerOptions,
  KafkaStreamConsumer,
  KafkaNodeCompressionTypes,
  RDKafkaProducerOptions,
  RDKafkaMessagePublisher
} from '@mojaloop-poc/lib-infrastructure'
import { ReservePayerFundsCmd, ReservePayerFundsCmdPayload } from '../messages/reserve_payer_funds_cmd'
import { CommitPayeeFundsCmd, CommitPayeeFundsCmdPayload } from '../messages/commit_payee_funds_cmd'
import { InvalidParticipantEvtError } from './errors'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'

export class ParticipantEvtHandler implements IRunHandler {
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    let kafkaMsgPublisher: IMessagePublisher | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`ParticipantEvtHandler - Creating ${appConfig.kafka.producer} participantEvtHandler.kafkaMsgPublisher...`)
    switch (appConfig.kafka.producer) {
      case (KafkaInfraTypes.NODE_KAFKA_STREAM):
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId: `participantEvtHandler-${Crypto.randomBytes(8)}`
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
              clientId: `participantEvtHandler-${Crypto.randomBytes(8)}`
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
              'dr_cb': true
            },
            topicConfig: {
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
        logger.warn('ParticipantEvtHandler - Unable to find a Kafka Producer implementation!')
        throw new Error('participantEvtHandler.kafkaMsgPublisher was not created!')
      }
    }

    logger.info(`ParticipantEvtHandler - Created kafkaMsgPublisher of type ${kafkaMsgPublisher.constructor.name}`)

    this._publisher = kafkaMsgPublisher
    await kafkaMsgPublisher.init()

    const histoParticipantEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'participantEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for participantEvtHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    const participantEvtHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoParticipantEvtHandlerMetric.startTimer()
      const evtname = message.msgName ?? 'unknown'
      try {
        logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
        let participantEvt: DomainEventMsg | undefined
        let participantCmd: CommandMsg | undefined
        // # Transform messages into correct Command
        switch (message.msgName) {
          case TransferPrepareAcceptedEvt.name: {
            participantEvt = TransferPrepareAcceptedEvt.fromIDomainMessage(message)
            if (participantEvt == null) throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - ${TransferPrepareAcceptedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = participantEvt.payload
            participantCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)
            participantCmd.passTraceInfo(participantEvt)
            break
          }
          case TransferFulfilAcceptedEvt.name: {
            participantEvt = TransferPrepareAcceptedEvt.fromIDomainMessage(message)
            if (participantEvt == null) throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - ${TransferFulfilAcceptedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = participantEvt.payload
            participantCmd = new CommitPayeeFundsCmd(commitPayeeFundsCmdPayload)
            participantCmd.passTraceInfo(participantEvt)
            break
          }
          default: {
            logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            histTimer({ success: 'true', evtname })
            return
          }
        }

        if (participantCmd != null) {
          logger.info(`ParticipantEvtHandler - publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${participantCmd?.msgName}:${message?.msgKey}:${participantCmd?.msgId}`)
          await kafkaMsgPublisher!.publish(participantCmd)
        } else {
          logger.warn(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
        }

        logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: true`)
        histTimer({ success: 'true', evtname })
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.error(err)
        histTimer({ success: 'false', error: err.message, evtname })
      }
    }

    let participantEvtConsumer: MessageConsumer | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`ParticipantEvtHandler - Creating ${appConfig.kafka.consumer} participantEvtConsumer...`)
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const participantEvtConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: `participantEvtConsumer-${Crypto.randomBytes(8)}`,
            groupId: 'participantEvtGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaGenericConsumer(participantEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_KAFKA_STREAM): {
        const participantEvtConsumerOptions: KafkaStreamConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: `participantEvtConsumer-${Crypto.randomBytes(8)}`,
            groupId: 'participantEvtGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaStreamConsumer(participantEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: [appConfig.kafka.host],
              clientId: `participantEvtConsumer-${Crypto.randomBytes(8)}`
            },
            consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
              groupId: 'participantEvtGroup'
            },
            consumerRunConfig: {
              autoCommit: appConfig.kafka.autocommit,
              autoCommitInterval: appConfig.kafka.autoCommitInterval,
              autoCommitThreshold: appConfig.kafka.autoCommitThreshold
            }
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      /* case (KafkaInfraTypes.NODE_RDKAFKA): {
        // TODO_NODE_RDKAFKA
        break
      }
      */
      default: {
        logger.warn('ParticipantEvtHandler - Unable to find a Kafka consumer implementation!')
        throw new Error('participantEvtConsumer was not created!')
      }
    }

    logger.info(`ParticipantEvtHandler - Created kafkaConsumer of type ${participantEvtConsumer.constructor.name}`)

    this._consumer = participantEvtConsumer
    logger.info('ParticipantEvtHandler - Initializing participantCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await participantEvtConsumer.init(participantEvtHandler)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
  }
}
