// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { TransferFulfilAcceptedEvtPayload, TransferFulfilAcceptedEvt, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '..'

const transferFulfilAcceptedEvtPayload: TransferFulfilAcceptedEvtPayload = {
  transferId: uuidv4(),
  amount: 1,
  currency: CurrencyTypes.USD,
  // payerId: 'fsp-24',
  // payeeId: 'fsp-14'
  payerId: 'fsp-14',
  payeeId: 'fsp-24'
}

const transferFulfilAcceptedEvt = new TransferFulfilAcceptedEvt(transferFulfilAcceptedEvtPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(transferFulfilAcceptedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
