// import { logger } from '../application'
import { appConfig, publishMessage } from '../utilities/publisher'
// import { CreateParticipantCmdPayload, CreateParticipantCmd } from '../messages/create_participant_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { CreateParticipantCmdPayload, CreateParticipantCmd } from '../../node_modules/@mojaloop-poc/participants/dist/messages/create_participant_cmd'
import { ParticipantAccountTypes, AccountLimitTypes, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const LIMIT = '10000000'

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
            value: LIMIT
          }
        ]
      }
    ],
    endpoints: [
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_POST',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_PUT',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_ERROR',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}/error`
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
            value: LIMIT
          }
        ]
      }
    ],
    endpoints: [
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_POST',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_PUT',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_ERROR',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}/error`
      },
      {
        type: 'SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL',
        value: 'joe@test.com'
      }
    ]
  }
}

const createParticipantCmdPayloadFSP3: CreateParticipantCmdPayload = {
  participant: {
    id: 'fsp-3',
    name: 'fsp-3',
    accounts: [
      {
        type: ParticipantAccountTypes.POSITION,
        currency: CurrencyTypes.USD,
        initialPosition: '0',
        position: '0', // TODO remove one of these (this or the above)
        limits: [
          {
            type: AccountLimitTypes.NET_DEBIT_CAP,
            value: LIMIT
          }
        ]
      }
    ],
    endpoints: [
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_POST',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_PUT',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_ERROR',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}/error`
      },
      {
        type: 'SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL',
        value: 'joe@test.com'
      }
    ]
  }
}

const createParticipantCmdPayloadFSP4: CreateParticipantCmdPayload = {
  participant: {
    id: 'fsp-4',
    name: 'fsp-4',
    accounts: [
      {
        type: ParticipantAccountTypes.POSITION,
        currency: CurrencyTypes.USD,
        initialPosition: '0',
        position: '0', // TODO remove one of these (this or the above)
        limits: [
          {
            type: AccountLimitTypes.NET_DEBIT_CAP,
            value: LIMIT
          }
        ]
      }
    ],
    endpoints: [
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_POST',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_PUT',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}`
      },
      {
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_ERROR',
        value: `http://${appConfig.simulator.host}/payeefsp/transfers/{{transferId}}/error`
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
const createParticipantCmdFSP3 = new CreateParticipantCmd(createParticipantCmdPayloadFSP3)
const createParticipantCmdFSP4 = new CreateParticipantCmd(createParticipantCmdPayloadFSP4)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(createParticipantCmdFSP1)
  await publishMessage(createParticipantCmdFSP2)
  await publishMessage(createParticipantCmdFSP3)
  await publishMessage(createParticipantCmdFSP4)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
