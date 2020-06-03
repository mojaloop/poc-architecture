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
import { MessageConsumer, KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions } from '@mojaloop-poc/lib-infrastructure'
// import { InMemoryTransferStateRepo } from '../infrastructure/inmemory_transfer_repo'
// import { TransferState } from '../domain/transfer_entity'
import { TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import { TransfersAgg } from '../domain/transfers_agg'
import { PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { AckPayerFundsReservedCmd } from '../messages/acknowledge_transfer_funds_cmd'
import { RedisTransferStateRepo } from '../infrastructure/redis_participant_repo'
import { ITransfersRepo } from '../domain/transfers_repo'

export const start = async (appConfig: any, logger: ILogger): Promise<MessageConsumer> => {
  // const repo: IEntityStateRepository<TransferState> = new InMemoryTransferStateRepo()
  const repo: ITransfersRepo = new RedisTransferStateRepo(appConfig.redis.host, logger)

  await repo.init()

  const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
    appConfig.kafka.host,
    'transfers',
    'development',
    logger
  )

  await kafkaMsgPublisher.init()

  const agg: TransfersAgg = new TransfersAgg(repo, kafkaMsgPublisher, logger)

  // ## Setup transferCmdConsumer
  const transferCmdHandler = async (message: IDomainMessage): Promise<void> => {
    try {
      logger.info(`transferCmdHandler processing event - ${message?.msgName}:${message?.msgId} - Start`)
      let transferCmd: CommandMsg | undefined
      // Transform messages into correct Command
      switch (message.msgName) {
        case PrepareTransferCmd.name: {
          // logger.info(`COMMAND:Type - ${ReservePayerFundsCmd.name}`)
          transferCmd = PrepareTransferCmd.fromIDomainMessage(message)
          break
        }
        case AckPayerFundsReservedCmd.name: {
          // logger.info(`COMMAND:Type - ${CommitPayeeFundsCmd.name}`)
          transferCmd = AckPayerFundsReservedCmd.fromIDomainMessage(message)
          break
        }
        default: {
          const err = new Error(`COMMAND:Type - Unknown - ${message?.msgName}:${message?.msgId}`)
          logger.error(err)
          throw err
        }
      }
      let processCommandResult: boolean = false
      if (transferCmd != null) {
        processCommandResult = await agg.processCommand(transferCmd)
      } else {
        logger.warn('transferCmdHandler is Unable to process command')
      }
      logger.info(`transferCmdHandler processing event - ${message?.msgName}:${message?.msgId} - Result: ${processCommandResult.toString()}`)
    } catch (err) {
      logger.error(err)
    }
  }

  const transferCmdConsumerOptions: KafkaGenericConsumerOptions = {
    client: {
      kafkaHost: appConfig.kafka.host,
      id: 'transferCmdConsumer',
      groupId: 'transferCmdGroup',
      fromOffset: EnumOffset.LATEST
    },
    topics: [TransfersTopics.Commands]
  }

  logger.info('Creating transferCmdConsumer...')
  const transferCmdConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(transferCmdConsumerOptions, logger)

  logger.info('Initializing transferCmdConsumer...')
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await transferCmdConsumer.init(transferCmdHandler)

  return transferCmdConsumer
}
