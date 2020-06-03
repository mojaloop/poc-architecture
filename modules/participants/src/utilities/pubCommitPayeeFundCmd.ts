// import { logger } from '../application'
import { publishMessage } from './publisher'
import { CommitPayeeFundsCmdPayload, CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'

const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = {
  payerId: 'fsp-14',
  payeeId: 'fsp-24',
  transferId: uuidv4(),
  currency: CurrencyTypes.USD,
  amount: 1
}
const commitPayeeFundsCmd = new CommitPayeeFundsCmd(commitPayeeFundsCmdPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(commitPayeeFundsCmd)
  process.exit(0)
}

start().catch((err) => {
  console.error(err)
}).finally(() => {
})
