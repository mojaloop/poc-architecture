/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { v4 as uuidv4 } from 'uuid'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { IEntityStateRepository, IMessagePublisher } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher } from '@mojaloop-poc/lib-infrastructure'
import { TransferState } from '../domain/transfer_entity'
import { InMemoryTransferStateRepo } from '../infrastructure/inmemory_transfer_repo'
import { TransfersAgg } from '../domain/transfers_agg'
import { CreateTransferCmd } from '../messages/create_transfer_cmd'
import { AcknowledgeTransferFundsCmd } from '../messages/acknowledge_transfer_funds_cmd'

const logger: ConsoleLogger = new ConsoleLogger()

async function start (): Promise<void> {
  const repo: IEntityStateRepository<TransferState> = new InMemoryTransferStateRepo()
//  const repo: IEntityStateRepository<TransferState> = new RedisParticipantStateRepo('redis://localhost:6379', logger)

  await repo.init()

  const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
    'localhost:9092',
    'client_a',
    'development',
    logger
  )

  await kafkaMsgPublisher.init()

  const agg: TransfersAgg = new TransfersAgg(repo, kafkaMsgPublisher, logger)

  const transferId: string = uuidv4()

  const createTransferCmd: CreateTransferCmd = new CreateTransferCmd(transferId, 100, 'USD', 'participant_1', 'participant_2')
  await agg.processCommand(createTransferCmd)

  const acknowledgeTransferFundsCmd: AcknowledgeTransferFundsCmd = new AcknowledgeTransferFundsCmd(transferId)
  await agg.processCommand(acknowledgeTransferFundsCmd)

  const acknowledgeTransferFundsCmdTriggerErrorUnknown: AcknowledgeTransferFundsCmd = new AcknowledgeTransferFundsCmd(uuidv4())
  await agg.processCommand(acknowledgeTransferFundsCmdTriggerErrorUnknown)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
  process.exit(0)
})
