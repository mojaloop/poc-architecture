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
import { iRunHandler, KafkaInfraTypes, KafkaJsProducerOptions, KafkajsMessagePublisher, KafkaJsConsumer, KafkaJsConsumerOptions, MessageConsumer, KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions, KafkaGenericProducerOptions } from '@mojaloop-poc/lib-infrastructure'
import { AckPayerFundsReservedCmdPayload, AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { AckPayeeFundsCommittedCmdPayload, AckPayeeFundsCommittedCmd } from '../messages/ack_payee_funds_committed_cmd'
import { InvalidTransferEvtError } from './errors'
import { PrepareTransferCmdPayload, PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { FulfilTransferCmd, FulfilTransferCmdPayload } from '../messages/fulfil_transfer_cmd'
import { Crypto } from '@mojaloop-poc/lib-utilities'

export class TransferEvtHandler implements iRunHandler {
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher

  async start (appConfig: any, logger: ILogger): Promise<void> {
    let kafkaMsgPublisher: IMessagePublisher | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`Creating ${appConfig.kafka.consumer} transferEvtHandler.kafkaMsgPublisher...`)
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId: `transferEvtHandler-${Crypto.randomBytes(8)}`
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
              clientId: `transferEvtHandler-${Crypto.randomBytes(8)}`
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
        throw new Error('transferEvtHandler.kafkaMsgPublisher was not created!')
      }
    }

    this._publisher = kafkaMsgPublisher
    await kafkaMsgPublisher.init()

    const transferEvtHandler = async (message: IDomainMessage): Promise<void> => {
      try {
        logger.info(`transferEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
        let transferEvt: DomainEventMsg | undefined
        let transferCmd: CommandMsg | null = null
        // # Transform messages into correct Command
        switch (message.msgName) {
          case PayerFundsReservedEvt.name: {
            transferEvt = PayerFundsReservedEvt.fromIDomainMessage(message)
            if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${PayerFundsReservedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const ackPayerFundsReservedCmdPayload: AckPayerFundsReservedCmdPayload = transferEvt.payload
            transferCmd = new AckPayerFundsReservedCmd(ackPayerFundsReservedCmdPayload)
            break
          }
          case PayeeFundsCommittedEvt.name: {
            transferEvt = PayeeFundsCommittedEvt.fromIDomainMessage(message)
            if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${PayeeFundsCommittedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const ackPayeeFundsCommittedCmdPayload: AckPayeeFundsCommittedCmdPayload = transferEvt.payload
            transferCmd = new AckPayeeFundsCommittedCmd(ackPayeeFundsCommittedCmdPayload)
            break
          }
          case TransferPrepareRequestedEvt.name: {
            transferEvt = TransferPrepareRequestedEvt.fromIDomainMessage(message)
            if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${TransferPrepareRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const prepareTransferCmdPayload: PrepareTransferCmdPayload = transferEvt.payload
            transferCmd = new PrepareTransferCmd(prepareTransferCmdPayload)
            break
          }
          case TransferFulfilRequestedEvt.name: {
            transferEvt = TransferFulfilRequestedEvt.fromIDomainMessage(message)
            if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${TransferFulfilRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const fulfilTransferCmdPayload: FulfilTransferCmdPayload = transferEvt.payload
            transferCmd = new FulfilTransferCmd(fulfilTransferCmdPayload)
            break
          }
          case TransferPrepareAcceptedEvt.name: {
            // logger.info(`EVENT:Type TransferPrepareAcceptedEvt ignored for now... TODO: refactor the topic names`)
            break
          }
          default: {
            logger.debug(`TransferEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
          }
        }

        if (transferCmd != null) {
          logger.info(`transferEvtHandler publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${transferCmd?.msgName}:${transferCmd?.msgId}`)
          await kafkaMsgPublisher!.publish(transferCmd)
          logger.info(`transferEvtHandler publishing cmd Finished - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
        }
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.warn(`transferEvtHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.error(err)
      }
    }

    let transferEvtConsumer: MessageConsumer | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`Creating ${appConfig.kafka.consumer} transferEvtConsumer...`)
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const transferEvtConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: `transferEvtConsumer-${Crypto.randomBytes(8)}`,
            groupId: 'transferEvtGroup',
            fromOffset: EnumOffset.LATEST
          },
          topics: [MLTopics.Events, ParticipantsTopics.DomainEvents]
        }
        transferEvtConsumer = new KafkaGenericConsumer(transferEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: ['localhost:9092'],
              clientId: `transferEvtConsumer-${Crypto.randomBytes(8)}`
            },
            consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
              groupId: 'transferEvtGroup'
            }
          },
          topics: [MLTopics.Events, ParticipantsTopics.DomainEvents]
        }
        transferEvtConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      default: {
        logger.warn('Unable to find a Kafka consumer implementation!')
        throw new Error('transferCmdConsumer was not created!')
      }
    }

    this._consumer = transferEvtConsumer
    logger.info('Initializing transferCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await transferEvtConsumer.init(transferEvtHandler)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
  }
}
