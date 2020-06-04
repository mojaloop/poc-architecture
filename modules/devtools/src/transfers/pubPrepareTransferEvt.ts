// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { CurrencyTypes, TransferPrepareRequestedEvt, TransferPrepareRequestedEvtPayload } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '..'

const prepareTransferEvtPayload: TransferPrepareRequestedEvtPayload = {
  transferId: uuidv4(),
  payerId: 'fsp-14',
  payeeId: 'fsp-24',
  currency: CurrencyTypes.USD,
  amount: 1
}
const reservePayerFundsCmd = new TransferPrepareRequestedEvt(prepareTransferEvtPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(reservePayerFundsCmd)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
