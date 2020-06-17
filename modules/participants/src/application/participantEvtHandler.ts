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
import { IRunHandler, KafkaInfraTypes, KafkaJsProducerOptions, KafkajsMessagePublisher, KafkaJsConsumer, KafkaJsConsumerOptions, MessageConsumer, KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions, KafkaGenericProducerOptions } from '@mojaloop-poc/lib-infrastructure'
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
    logger.info(`Creating ${appConfig.kafka.consumer} participantEvtHandler.kafkaMsgPublisher...`)
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId: `participantEvtHandler-${Crypto.randomBytes(8)}`
            }
          }
        }
        kafkaMsgPublisher = new KafkaMessagePublisher(
          kafkaGenericProducerOptions,
          logger
        )
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsProducerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: ['localhost:9092'],
              clientId: `participantEvtHandler-${Crypto.randomBytes(8)}`
            },
            producer: { // https://kafka.js.org/docs/producing#options
              allowAutoTopicCreation: true,
              idempotent: true, // false is default
              transactionTimeout: 60000
            }
          }
        }
        kafkaMsgPublisher = new KafkajsMessagePublisher(
          kafkaJsConsumerOptions,
          logger
        )
        break
      }
      default: {
        logger.warn('Unable to find a Kafka Producer implementation!')
        throw new Error('participantEvtHandler.kafkaMsgPublisher was not created!')
      }
    }

    this._publisher = kafkaMsgPublisher
    await kafkaMsgPublisher.init()

    const histoParticipantEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'participantEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for participantEvtHandler', // Description of metric
      ['success', 'error'] // Define a custom label 'success'
    )

    const participantEvtHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoParticipantEvtHandlerMetric.startTimer()
      try {
        logger.info(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
        let participantEvt: DomainEventMsg | undefined
        let participantCmd: CommandMsg | undefined
        // # Transform messages into correct Command
        switch (message.msgName) {
          case TransferPrepareAcceptedEvt.name: {
            participantEvt = TransferPrepareAcceptedEvt.fromIDomainMessage(message)
            if (participantEvt == null) throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - ${TransferPrepareAcceptedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = participantEvt.payload
            participantCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)
            break
          }
          case TransferFulfilAcceptedEvt.name: {
            participantEvt = TransferPrepareAcceptedEvt.fromIDomainMessage(message)
            if (participantEvt == null) throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - ${TransferFulfilAcceptedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = participantEvt.payload
            participantCmd = new CommitPayeeFundsCmd(commitPayeeFundsCmdPayload)
            break
          }
          default: {
            logger.info(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            histTimer({success: 'true'})
            return
          }
        }

        if (participantCmd != null) {
          logger.info(`participantEvtHandler publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${participantCmd?.msgName}:${message?.msgKey}:${participantCmd?.msgId}`)
          await kafkaMsgPublisher!.publish(participantCmd)
        } else {
          logger.warn(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
        }

        logger.info(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: true`)
        histTimer({success: 'true'})
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.info(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.error(err)
        histTimer({success: 'false', error: err.message})
      }
    }

    let participantEvtConsumer: MessageConsumer | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`Creating ${appConfig.kafka.consumer} participantEvtConsumer...`)
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const participantEvtConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: `participantEvtConsumer-${Crypto.randomBytes(8)}`,
            groupId: 'participantEvtGroup',
            fromOffset: EnumOffset.LATEST
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaGenericConsumer(participantEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: ['localhost:9092'],
              clientId: `participantEvtConsumer-${Crypto.randomBytes(8)}`
            },
            consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
              groupId: 'participantEvtGroup'
            }
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      default: {
        logger.warn('Unable to find a Kafka consumer implementation!')
        throw new Error('participantEvtConsumer was not created!')
      }
    }

    this._consumer = participantEvtConsumer
    logger.info('Initializing participantCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await participantEvtConsumer.init(participantEvtHandler)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
  }
}
