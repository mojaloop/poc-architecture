import { publishMessage } from '../utilities/publisher'
import { CurrencyTypes, TransferFulfilRequestedEvt, TransferFulfilRequestedEvtPayload, TransferPrepareRequestedEvtPayload, TransferPrepareRequestedEvt } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const msgParams = {
  transferId: uuidv4(),
  payerId: 'fsp-1',
  payeeId: 'fsp-2',
  currency: CurrencyTypes.USD,
  amount: 1
}

const transferPrepareRequestedEvtPayload: TransferPrepareRequestedEvtPayload = msgParams
const transferPrepareRequestedEvt = new TransferPrepareRequestedEvt(transferPrepareRequestedEvtPayload)

const transferFulfilRequestedEvtPayload: TransferFulfilRequestedEvtPayload = msgParams
const transferFulfilRequestedEvt = new TransferFulfilRequestedEvt(transferFulfilRequestedEvtPayload)

const delay = async (ms: number): Promise <void> => {
  /* eslint-disable-next-line @typescript-eslint/return-await */
  return new Promise(resolve => setTimeout(resolve, ms))
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  logger.info(`Sending Transfer ${msgParams.transferId}`)
  await publishMessage(transferPrepareRequestedEvt)
  await delay(1000)
  await publishMessage(transferFulfilRequestedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
