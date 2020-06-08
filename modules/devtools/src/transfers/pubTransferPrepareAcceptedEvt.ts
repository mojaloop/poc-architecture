// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { TransferPrepareAcceptedEvtPayload, TransferPrepareAcceptedEvt, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const transferPrepareAcceptedEvtPayload: TransferPrepareAcceptedEvtPayload = {
  transferId: uuidv4(),
  amount: '1',
  currency: CurrencyTypes.USD,
  payerId: 'fsp-1',
  payeeId: 'fsp-2'
}

const transferPrepareAcceptedEvt = new TransferPrepareAcceptedEvt(transferPrepareAcceptedEvtPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(transferPrepareAcceptedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
