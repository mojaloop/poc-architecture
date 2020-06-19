// import { logger } from '../application'
import { appConfig, publishMessage, publishMessageMultiple } from '../utilities/publisher'
// import { CreateParticipantCmdPayload, CreateParticipantCmd } from '../messages/create_participant_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { CreateParticipantCmdPayload, CreateParticipantCmd } from '@mojaloop-poc/participants/dist/messages/create_participant_cmd'
import { ParticipantAccountTypes, AccountLimitTypes, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { ILogger, IMessage } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const LIMIT = '10000000'

const simulatorHost: string = appConfig.simulator.host?.toString() ?? 'localhost:8444'

const participantCmdList: IMessage[] = []
for(let i=1; i <= 8; i++ ) {
  const participantId = `simfsp0${i}`
  logger.info(`Creating ParticipantCmdPayload for ${participantId}`)
  const createParticipantCmdPayloadFSP: CreateParticipantCmdPayload = {
    participant: {
      id: participantId,
      name: participantId,
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
          value: `http://${simulatorHost}/payeefsp/transfers`
        },
        {
          type: 'FSPIOP_CALLBACK_URL_TRANSFER_PUT',
          value: `http://${simulatorHost}/payeefsp/transfers/{{transferId}}`
        },
        {
          type: 'FSPIOP_CALLBACK_URL_TRANSFER_ERROR',
          value: `http://${simulatorHost}/payeefsp/transfers/{{transferId}}/error`
        },
        {
          type: 'SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL',
          value: 'joe@test.com'
        }
      ]
    }
  }
  const createParticipantCmdFSP = new CreateParticipantCmd(createParticipantCmdPayloadFSP)
  participantCmdList.push(createParticipantCmdFSP)
}



/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessageMultiple(participantCmdList)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
