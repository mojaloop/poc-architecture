// import { logger } from '../application'
import * as Publisher from '../utilities/publisher'
import { TransferFulfilAcceptedEvtPayload, TransferFulfilAcceptedEvt, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { MojaLogger } from '@mojaloop-poc/lib-utilities'
import { FspIds } from '../utilities/participant'

const logger: ILogger = new MojaLogger()

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await Publisher.init()

  const transferFulfilAcceptedEvtPayload: TransferFulfilAcceptedEvtPayload = {
    transferId: uuidv4(),
    amount: '1',
    currency: CurrencyTypes.USD,
    payerId: FspIds[0],
    payeeId: FspIds[1]
  }

  const transferFulfilAcceptedEvt = new TransferFulfilAcceptedEvt(transferFulfilAcceptedEvtPayload)

  await Publisher.publishMessage(transferFulfilAcceptedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.isErrorEnabled() && logger.error(err)
}).finally(() => {
})
