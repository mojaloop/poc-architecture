/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { IEntityStateRepository, IMessagePublisher } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher } from '@mojaloop-poc/lib-infrastructure'
import { TransferState } from '../domain/transfer_entity'
import { InMemoryTransferStateRepo } from '../infrastructure/inmemory_transfer_repo'
import { TransfersAgg } from '../domain/transfers_agg'

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
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
  process.exit(0)
})
