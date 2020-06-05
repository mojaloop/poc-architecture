// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { CurrencyTypes, TransferPrepareRequestedEvt, TransferPrepareRequestedEvtPayload } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const transferPrepareRequestedEvtPayload: TransferPrepareRequestedEvtPayload = {
  transferId: uuidv4(),
  payerId: 'fsp-1',
  payeeId: 'fsp-2',
  currency: CurrencyTypes.USD,
  amount: 1
}
const transferPrepareRequestedEvt = new TransferPrepareRequestedEvt(transferPrepareRequestedEvtPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(transferPrepareRequestedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
