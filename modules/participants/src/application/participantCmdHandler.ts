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
import { CommandMsg, IDomainMessage, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics } from '@mojaloop-poc/lib-public-messages'
import { MessageConsumer, KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ParticpantsAgg } from '../domain/participants_agg'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CreateParticipantCmd } from '../messages/create_participant_cmd'
import { RedisParticipantStateRepo } from '../infrastructure/redis_participant_repo'
import { IParticipantRepo } from '../domain/participant_repo'

export const start = async (appConfig: any, logger: ILogger): Promise<MessageConsumer> => {
  // const repo: IEntityStateRepository<ParticipantState> = new InMemoryParticipantStateRepo();
  const repo: IParticipantRepo = new RedisParticipantStateRepo(appConfig.redis.host, logger)

  await repo.init()

  const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
    appConfig.kafka.host,
    'participants',
    'development',
    logger
  )

  await kafkaMsgPublisher.init()

  const agg: ParticpantsAgg = new ParticpantsAgg(repo, kafkaMsgPublisher, logger)

  // ## Local Test
  // // const payerId: string = '47fca31d-6784-4ac2-afd2-03af341df7e1' // Use this to validate duplicate insert logic for participants
  // const payerId: string = uuidv4() // Use this to create a new participant record

  // const transferId: string = uuidv4()

  // const createParticipantCmd: CreateParticipantCmd = new CreateParticipantCmd({
  //   id: payerId,
  //   name: 'participant 1',
  //   limit: 1000,
  //   initialPosition: 100
  // })
  // await agg.processCommand(createParticipantCmd)

  // const reserveCmd: ReservePayerFundsCmd = new ReservePayerFundsCmd({
  //   payerId,
  //   transferId: transferId,
  //   amount: 50
  // })
  // await agg.processCommand(reserveCmd)

  // ## Setup participantCmdConsumer
  const participantCmdHandler = async (message: IDomainMessage): Promise<void> => {
    try {
      // transfer messages into correct Participant Command
      let participantCmd: CommandMsg | undefined
      switch (message.msgName) {
        case CreateParticipantCmd.name: {
          logger.info(`COMMAND:Type - ${CreateParticipantCmd.name}`)
          participantCmd = CreateParticipantCmd.fromIDomainMessage(message)
          break
        }
        case ReservePayerFundsCmd.name: {
          logger.info(`COMMAND:Type - ${ReservePayerFundsCmd.name}`)
          participantCmd = ReservePayerFundsCmd.fromIDomainMessage(message)
          break
        }
        default: {
          const err = new Error(`COMMAND:Type - Unknown - ${message.msgName}`)
          logger.error(err)
          throw err
        }
      }

      if (participantCmd !== undefined) {
        await agg.processCommand(participantCmd)
      } else {
        logger.warn('participantCmdHandler is Unable to process command')
      }
    } catch (err) {
      logger.error(err)
    }
  }

  const participantCmdConsumerOptions: KafkaGenericConsumerOptions = {
    client: {
      kafkaHost: appConfig.kafka.host,
      id: 'participantCmdConsumer',
      groupId: 'participantCmdGroup',
      fromOffset: EnumOffset.LATEST
    },
    topics: [ParticipantsTopics.Commands]
  }

  logger.info('Creating participantCmdConsumer...')
  const participantCmdConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(participantCmdConsumerOptions, logger)

  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  // process.on('exit', async (): Promise<void> => {
  //   logger.info('Exiting process...')
  //   logger.info('Disconnecting handlers...')
  //   await createParticipantCmdConsumer.disconnect()
  //   logger.info('Exit complete')
  // })

  logger.info('Initializing participantCmdConsumer...')
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await participantCmdConsumer.init(participantCmdHandler)

  return participantCmdConsumer
}

// start().catch((err) => {
//   logger.error(err)
// }).finally(() => {
// })
