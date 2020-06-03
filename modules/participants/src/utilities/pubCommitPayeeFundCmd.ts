// import { logger } from '../application'
import { publishMessage } from './publisher'
import { CommitPayeeFundsCmdPayload, CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'


const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = {
  "payerId": "fsp-10",
  "payeeId": "fsp-20",
  "transferId": "34e6af77-d05d-43e8-ae49-1a2571510697",
  "currency": CurrencyTypes.USD,
  "amount": 1
}
const commitPayeeFundsCmd = new CommitPayeeFundsCmd(commitPayeeFundsCmdPayload)

const start = async () => {
  await publishMessage(commitPayeeFundsCmd)
  process.exit(0)  
}

start()
