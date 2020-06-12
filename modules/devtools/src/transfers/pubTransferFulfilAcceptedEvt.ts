// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { TransferFulfilAcceptedEvtPayload, TransferFulfilAcceptedEvt, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const transferFulfilAcceptedEvtPayload: TransferFulfilAcceptedEvtPayload = {
  transferId: uuidv4(),
  amount: '1',
  currency: CurrencyTypes.USD,
  payerId: 'fsp-1',
  payeeId: 'fsp-2'
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
