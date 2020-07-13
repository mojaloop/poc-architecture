// import { logger } from '../application'
import * as Publisher from '../utilities/publisher'
// import { CommitPayeeFundsCmdPayload, CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { CommitPayeeFundsCmdPayload, CommitPayeeFundsCmd } from '../../node_modules/@mojaloop-poc/participants/dist/messages/commit_payee_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { MojaLogger } from '@mojaloop-poc/lib-utilities'
import { FspIds } from '../utilities/participant'

const logger: ILogger = new MojaLogger()

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = {
    payerId: FspIds[0],
    payeeId: FspIds[1],
    transferId: uuidv4(),
    currency: CurrencyTypes.USD,
    amount: '1'
  }
  const commitPayeeFundsCmd = new CommitPayeeFundsCmd(commitPayeeFundsCmdPayload)

  await Publisher.init()
  await Publisher.publishMessage(commitPayeeFundsCmd)
  process.exit(0)
}

start().catch((err) => {
  logger.isErrorEnabled() && logger.error(err)
}).finally(() => {
})
