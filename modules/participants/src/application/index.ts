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
import { v4 as uuidv4 } from 'uuid'

// import {InMemoryParticipantStateRepo} from "../infrastructure/inmemory_participant_repo";
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { CommandMsg, IDomainMessage, IEntityStateRepository, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ParticipantState } from '../domain/participant_entity'
import { ParticpantsAgg } from '../domain/participants_agg'
import { ReservePayerFundsCmd, ReservePayerFundsCmdPayload } from '../messages/reserve_payer_funds_cmd'
import { CreateParticipantCmd, CreateParticipantCmdPayload } from '../messages/create_participant_cmd'
import { RedisParticipantStateRepo } from '../infrastructure/redis_participant_repo'
import { ParticipantsAggTopics } from '../domain/participants_agg'

const logger: ILogger = new ConsoleLogger()

const start = async (): Promise<void> => {
  // const repo: IEntityStateRepository<ParticipantState> = new InMemoryParticipantStateRepo();
  const repo: IEntityStateRepository<ParticipantState> = new RedisParticipantStateRepo('redis://localhost:6379', logger)

  await repo.init()

  const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
    'localhost:9092',
    'client_a',
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

  // ## Setup createParticipantCmdConsumerConfig
  const participantCmdHandler = async (message: IDomainMessage): Promise<void> => {
    try {
      // transfer messages into correct Participant Command
      let participantCmd: CommandMsg | undefined
      switch (message.msgName) {
        case CreateParticipantCmd.name:
          logger.info(`COMMAND:Type - ${CreateParticipantCmd.name}`)
          participantCmd = CreateParticipantCmd.fromIDomainMessage(message)
          break
        case ReservePayerFundsCmd.name:
          logger.info(`COMMAND:Type - ${ReservePayerFundsCmd.name}`)
          participantCmd = ReservePayerFundsCmd.fromIDomainMessage(message)
          break
        default:
          const err = new Error(`COMMAND:Type - Unknown - ${message.msgName}`)
          logger.error(err)
          throw err
      }

      if(participantCmd != undefined) {
        await agg.processCommand(participantCmd)
      } else {
        logger.warn('participantCmdHandler is Unable to process command')
      }
    } catch (err) {
      logger.error(err)
    }
  }

  const createParticipantCmdConsumerOptions: KafkaGenericConsumerOptions = {
    client: {
      kafkaHost: 'localhost:9092',
      id: 'participants',
      groupId: 'participants',
      fromOffset: EnumOffset.LATEST
    },
    topics: [ParticipantsAggTopics.Commands]
  }
  
  const createParticipantCmdConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(createParticipantCmdConsumerOptions, participantCmdHandler, logger)

  process.on('exit', async function () {
    logger.info('Exiting process...')
    logger.info('Disconnecting handlers...')
    await createParticipantCmdConsumer.disconnect()
    logger.info('Exit complete')
  })
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
