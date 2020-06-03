// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { TransferPrepareAcceptedEvtPayload, TransferPrepareAcceptedEvt, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'

import { v4 as uuidv4 } from 'uuid'

const transferPrepareAcceptedEvtPayload: TransferPrepareAcceptedEvtPayload = {
  transferId: uuidv4(),
  amount: 1,
  currency: CurrencyTypes.USD,
  payerId: 'fsp-14',
  payeeId: 'fsp-24'
}

const transferPrepareAcceptedEvt = new TransferPrepareAcceptedEvt(transferPrepareAcceptedEvtPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(transferPrepareAcceptedEvt)
  process.exit(0)
}

start().catch((err) => {
  console.error(err)
}).finally(() => {
})
