// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
// import { PrepareTransferCmdPayload, PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { PrepareTransferCmdPayload, PrepareTransferCmd } from '../../node_modules/@mojaloop-poc/transfers/dist/messages/prepare_transfer_cmd'

const prepareTransferCmdPayload: PrepareTransferCmdPayload = {
  transferId: uuidv4(),
  payerId: 'fsp-14',
  payeeId: 'fsp-24',
  currency: CurrencyTypes.USD,
  amount: 1
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
