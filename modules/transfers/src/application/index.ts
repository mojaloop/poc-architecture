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
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { IEntityStateRepository, IMessagePublisher } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher } from '@mojaloop-poc/lib-infrastructure'
import { TransferState } from '../domain/transfer_entity'
import { InMemoryTransferStateRepo } from '../infrastructure/inmemory_transfer_repo'
import { TransfersAgg } from '../domain/transfers_agg'
import { PrepareTransferCmd } from '../messages/create_transfer_cmd'
import { AckPayerFundsReservedCmd } from '../messages/acknowledge_transfer_funds_cmd'

const logger: ConsoleLogger = new ConsoleLogger()

async function start (): Promise<void> {
  const repo: IEntityStateRepository<TransferState> = new InMemoryTransferStateRepo()
  // const repo: IEntityStateRepository<TransferState> = new RedisParticipantStateRepo('redis://localhost:6379', logger)

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

  const prepareTransferCmd: PrepareTransferCmd = new PrepareTransferCmd(transferId, 100, 'USD', 'participant_1', 'participant_2')
  await agg.processCommand(prepareTransferCmd)

  const ackPayerFundsReservedCmd: AckPayerFundsReservedCmd = new AckPayerFundsReservedCmd(transferId)
  await agg.processCommand(ackPayerFundsReservedCmd)

  const ackPayerFundsReservedCmdTriggerErrorUnknown: AckPayerFundsReservedCmd = new AckPayerFundsReservedCmd(uuidv4())
  await agg.processCommand(ackPayerFundsReservedCmdTriggerErrorUnknown)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
  process.exit(0)
})
