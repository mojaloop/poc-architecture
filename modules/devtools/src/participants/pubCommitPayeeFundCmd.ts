// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
// import { CommitPayeeFundsCmdPayload, CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { CommitPayeeFundsCmdPayload, CommitPayeeFundsCmd } from '../../node_modules/@mojaloop-poc/participants/dist/messages/commit_payee_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = {
  payerId: 'fsp-1',
  payeeId: 'fsp-2',
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
  logger.error(err)
}).finally(() => {
})
