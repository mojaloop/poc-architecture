// import { logger } from '../application'
import { publishMessage } from './publisher'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { PrepareTransferCmdPayload, PrepareTransferCmd } from '../messages/prepare_transfer_cmd'

const prepareTransferCmdPayload: PrepareTransferCmdPayload = {
  transfer: {
    id: uuidv4(),
    payerId: 'fsp-14',
    payeeId: 'fsp-24',
    currencyId: CurrencyTypes.USD,
    amount: 1
  }
}
const reservePayerFundsCmd = new PrepareTransferCmd(prepareTransferCmdPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(reservePayerFundsCmd)
  process.exit(0)
}

start().catch((err) => {
  console.error(err)
}).finally(() => {
})
