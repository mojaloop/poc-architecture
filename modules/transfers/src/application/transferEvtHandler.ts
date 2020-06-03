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
import { TransfersTopics, PayerFundsReservedEvt } from '@mojaloop-poc/lib-public-messages'
import { MessageConsumer, KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions } from '@mojaloop-poc/lib-infrastructure'
import { AckPayerFundsReservedCmdPayload, AckPayerFundsReservedCmd } from '../messages/acknowledge_transfer_funds_cmd'
import { InvalidTransferEvtError } from './errors'

export const start = async (appConfig: any, logger: ILogger): Promise<MessageConsumer> => {
  const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
    appConfig.kafka.host,
    'transferEvtHandler',
    'development',
    logger
  )

  await kafkaMsgPublisher.init()

  const transferEvtHandler = async (message: IDomainMessage): Promise<void> => {
    try {
      logger.info(`transferEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Start`)
      let transferEvt: DomainEventMsg | undefined
      let transferCmd: CommandMsg | undefined
      // # Transform messages into correct Command
      switch (message.msgName) {
        case PayerFundsReservedEvt.name: {
          transferEvt = PayerFundsReservedEvt.fromIDomainMessage(message)
          if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${PayerFundsReservedEvt.name} is Invalid - ${message?.msgName}:${message?.msgId}`)
          const ackPayerFundsReservedCmdPayload: AckPayerFundsReservedCmdPayload = transferEvt.payload
          transferCmd = new AckPayerFundsReservedCmd(ackPayerFundsReservedCmdPayload)
          break
        }
        /* case TransferFulfilAcceptedEvt.name: {
          transferEvt = TransferPrepareAcceptedEvt.fromIDomainMessage(message)
          if (transferEvt == null) throw new InvalidTransferEvtError(`TransferEvtHandler is unable to process event - ${TransferFulfilAcceptedEvt.name} is Invalid - ${message?.msgName}:${message?.msgId}`)
          const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = transferEvt.payload
          transferCmd = new CommitPayeeFundsCmd(commitPayeeFundsCmdPayload)
          break
        } */
        default: {
          const err = new Error(`EVENT:Type - Unknown - ${message?.msgName}:${message?.msgId}`)
          logger.error(err)
          throw err
        }
      }

      if (transferCmd != null) {
        logger.info(`transferEvtHandler publishing cmd - ${message?.msgName}:${message?.msgId} - Cmd: ${transferCmd?.msgName}:${transferCmd?.msgId}`)
        await kafkaMsgPublisher.publish(transferCmd)
      } else {
        logger.warn(`transferEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Unable to process event`)
      }

      logger.info(`transferEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Result: true`)
    } catch (err) {
      const errMsg: string = err?.message?.toString()
      logger.info(`transferEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Error: ${errMsg}`)
      logger.error(err)
    }
  }

  const transferEvtConsumerOptions: KafkaGenericConsumerOptions = {
    client: {
      kafkaHost: appConfig.kafka.host,
      id: 'transferEvtConsumer',
      groupId: 'transferEvtGroup',
      fromOffset: EnumOffset.LATEST
    },
    topics: [TransfersTopics.DomainEvents]
  }

  logger.info('Creating transferEvtConsumer...')
  const transferEvtConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(transferEvtConsumerOptions, logger)

  logger.info('Initializing transferCmdConsumer...')
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await transferEvtConsumer.init(transferEvtHandler)

  return transferEvtConsumer
}
