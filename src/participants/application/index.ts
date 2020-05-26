/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

'use strict'
import { v4 as uuidv4 } from 'uuid'

// import {InMemoryParticipantStateRepo} from "../infrastructure/inmemory_participant_repo";
import { IEntityStateRepository } from '../../shared/domain_abstractions/ientity_state_repository'
import { ParticipantState } from '../domain/participant_entity'
import { IMessagePublisher } from '../../shared/domain_abstractions/imessage_publisher'
import { ParticpantsAgg } from '../domain/participants_agg'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { ConsoleLogger } from '../../shared/utilities/logger'
import { KafkaMessagePublisher } from '../../shared/infrastructure/kafka_message_publisher'
import { CreateParticipantCmd } from '../messages/create_participant_cmd'
import { RedisParticipantStateRepo } from '../infrastructure/redis_participant_repo'

const logger: ConsoleLogger = new ConsoleLogger()

async function start (): Promise<void> {
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

  const agg: ParticpantsAgg = new ParticpantsAgg(repo, kafkaMsgPublisher)

  const payerId: string = '47fca31d-6784-4ac2-afd2-03af341df7e1' // uuidv4();
  // const payerId: string = uuidv4();
  const transferId: string = uuidv4()

  const createParticipantCmd: CreateParticipantCmd = new CreateParticipantCmd(payerId, 'participant 1', 1000, 100)
  await agg.processCommand(createParticipantCmd)

  const reserveCmd: ReservePayerFundsCmd = new ReservePayerFundsCmd(payerId, transferId, 50)
  await agg.processCommand(reserveCmd)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
  process.exit(0)
})