// import { logger } from '../application'
import { publishMessage } from './publisher'
import { TransferPrepareAcceptedEvtPayload, TransferPrepareAcceptedEvt } from '@mojaloop-poc/lib-public-messages'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'

const reservePayerFundsCmdPayload: TransferPrepareAcceptedEvtPayload = {
  transferId: uuidv4(),
  amount: 1,
  currency: CurrencyTypes.USD,
  payerId: 'fsp-14',
  payeeId: 'fsp-24'
}

const reservePayerFundsCmd = new TransferPrepareAcceptedEvt(reservePayerFundsCmdPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(reservePayerFundsCmd)
  process.exit(0)
}

start().catch((err) => {
  console.error(err)
}).finally(() => {
})
