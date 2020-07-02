// import { logger } from '../application'
import * as Publisher from '../utilities/publisher'
import { TransferPrepareAcceptedEvtPayload, TransferPrepareAcceptedEvt, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { MojaLogger } from '@mojaloop-poc/lib-utilities'
import { FspIds } from '../utilities/participant'

const logger: ILogger = new MojaLogger()

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await Publisher.init()

  const transferPrepareAcceptedEvtPayload: TransferPrepareAcceptedEvtPayload = {
    transferId: uuidv4(),
    amount: '1',
    currency: CurrencyTypes.USD,
    payerId: FspIds[0],
    payeeId: FspIds[1]
  }

  const transferPrepareAcceptedEvt = new TransferPrepareAcceptedEvt(transferPrepareAcceptedEvtPayload)

  await Publisher.publishMessage(transferPrepareAcceptedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
