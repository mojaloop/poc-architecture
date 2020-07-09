// import { logger } from '../application'
import * as Publisher from '../utilities/publisher'
// import { CreateParticipantCmdPayload, CreateParticipantCmd } from '../messages/create_participant_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { CreateParticipantCmdPayload, CreateParticipantCmd } from '@mojaloop-poc/participants/dist/messages/create_participant_cmd'
import { ParticipantAccountTypes, AccountLimitTypes, CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { ILogger, IMessage } from '@mojaloop-poc/lib-domain'
import { MojaLogger, getEnvIntegerOrDefault } from '@mojaloop-poc/lib-utilities'
import { getFspList } from '../utilities/participant'

const logger: ILogger = new MojaLogger()

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await Publisher.init()

  const LIMIT = process.env?.LIMIT ?? '10000000'

  const simulatorHost: string = Publisher.appConfig.simulator.host?.toString() ?? 'localhost:8444'
  const PARTITION_CNT: number = getEnvIntegerOrDefault('PARTITION_CNT', 1)

  const participantCmdList: IMessage[] = []
  let partitionIndex = 0
  for (const fsp of getFspList()) {
    const partition = partitionIndex % PARTITION_CNT
    const participantId = fsp
    logger.info(`Creating ParticipantCmdPayload for ${participantId} for partition:'${partition}'`)
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
        ],
        partition
      }
    }
    const createParticipantCmdFSP = new CreateParticipantCmd(createParticipantCmdPayloadFSP)
    participantCmdList.push(createParticipantCmdFSP)
    partitionIndex++
  }
  await Publisher.publishMessageMultiple(participantCmdList)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
