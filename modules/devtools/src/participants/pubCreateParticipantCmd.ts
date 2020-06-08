// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
// import { CreateParticipantCmdPayload, CreateParticipantCmd } from '../messages/create_participant_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { CreateParticipantCmdPayload, CreateParticipantCmd } from '../../node_modules/@mojaloop-poc/participants/dist/messages/create_participant_cmd'
import { ParticipantAccountTypes, AccountLimitTypes, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const createParticipantCmdPayloadFSP1: CreateParticipantCmdPayload = {
  participant: {
    id: 'fsp-1',
    name: 'fsp-1',
    accounts: [
      {
        type: ParticipantAccountTypes.POSITION,
        currency: CurrencyTypes.USD,
        initialPosition: '0',
        position: '0', // TODO remove one of these (this or the above)
        limits: [
          {
            type: AccountLimitTypes.NET_DEBIT_CAP,
            value: '100000'
          }
        ]
      }
    ],
    endpoints: [
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER',
        value: 'http://test'
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER',
        value: 'http://test'
      },
      {
        type: 'SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL',
        value: 'joe@test.com'
      }
    ]
  }
}

const createParticipantCmdPayloadFSP2: CreateParticipantCmdPayload = {
  participant: {
    id: 'fsp-2',
    name: 'fsp-2',
    accounts: [
      {
        type: ParticipantAccountTypes.POSITION,
        currency: CurrencyTypes.USD,
        initialPosition: '0',
        position: '0', // TODO remove one of these (this or the above)
        limits: [
          {
            type: AccountLimitTypes.NET_DEBIT_CAP,
            value: '100000'
          }
        ]
      }
    ],
    endpoints: [
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER',
        value: 'http://test'
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER',
        value: 'http://test'
      },
      {
        type: 'SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL',
        value: 'joe@test.com'
      }
    ]
  }
}

const createParticipantCmdFSP1 = new CreateParticipantCmd(createParticipantCmdPayloadFSP1)
const createParticipantCmdFSP2 = new CreateParticipantCmd(createParticipantCmdPayloadFSP2)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(createParticipantCmdFSP1)
  await publishMessage(createParticipantCmdFSP2)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
