// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { CurrencyTypes, TransferFulfilRequestedEvt, TransferFulfilRequestedEvtPayload } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const transferFulfilRequestedEvtPayload: TransferFulfilRequestedEvtPayload = {
  transferId: uuidv4(),
  payerId: 'fsp-1',
  payeeId: 'fsp-2',
  currency: CurrencyTypes.USD,
  amount: 1
}
const transferFulfilRequestedEvt = new TransferFulfilRequestedEvt(transferFulfilRequestedEvtPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(transferFulfilRequestedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
