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
// import { IDomainMessage, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics, TransferPrepareAcceptedEvt, TransferFulfilAcceptedEvt, TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import { MessageConsumer, KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'

export const start = async (appConfig: any, logger: ILogger): Promise<MessageConsumer> => {
  const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
    appConfig.kafka.host,
    'participantEvtHandler',
    'development',
    logger
  )

  await kafkaMsgPublisher.init()

  const participantEvtHandler = async (message: IDomainMessage): Promise<void> => {
    try {
      logger.info(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Start`)
      let participantCmd: CommandMsg | undefined
      // # Transform messages into correct Command
      switch (message.msgName) {
        case TransferPrepareAcceptedEvt.name: {
          participantCmd = ReservePayerFundsCmd.fromIDomainMessage(message)
          break
        }
        case TransferFulfilAcceptedEvt.name: {
          participantCmd = CommitPayeeFundsCmd.fromIDomainMessage(message)
          break
        }
        default: {
          const err = new Error(`EVENT:Type - Unknown - ${message?.msgName}:${message?.msgId}`)
          logger.error(err)
          throw err
        }
      }
      
      if (participantCmd != null) {
        logger.info(`participantEvtHandler publishing cmd - ${participantCmd?.msgName}:${participantCmd?.msgId}`)
        await kafkaMsgPublisher.publish(participantCmd)
      } else {
        logger.warn(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Unable to process event`)
      }
    
      logger.info(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Result: ${true}`)
    } catch (err) {
      logger.info(`participantEvtHandler processing event - ${message?.msgName}:${message?.msgId} - Error: ${err.message}`)
      logger.error(err)
    }
  }

  const participantEvtConsumerOptions: KafkaGenericConsumerOptions = {
    client: {
      kafkaHost: appConfig.kafka.host,
      id: 'participantEvtConsumer',
      groupId: 'participantEvtGroup',
      fromOffset: EnumOffset.LATEST
    },
    topics: [TransfersTopics.DomainEvents]
  }

  logger.info('Creating participantEvtConsumer...')
  const participantEvtConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(participantEvtConsumerOptions, logger)

  logger.info('Initializing participantCmdConsumer...')
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await participantEvtConsumer.init(participantEvtHandler)

  return participantEvtConsumer
}
