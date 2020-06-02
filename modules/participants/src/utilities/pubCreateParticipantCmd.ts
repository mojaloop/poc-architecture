// import { logger } from '../application'
import { publishMessage } from './publisher'
import { CreateParticipantCmdPayload, CreateParticipantCmd } from '../messages/create_participant_cmd'

const createParticipantCmdPayload: CreateParticipantCmdPayload = {
  "id": "fsp-1",
  "name": "fsp-1",
  "accounts": {
      "USD": {
          "id": "participant-acc-fsp-1-USD",
          "currency": "USD",
          "initialPosition": 0,
          "position": 0,
          "limits": {
              "NET_DEBIT_CAP": {
                  "id": "participant-acc-fsp-1-limit-USD-NET_DEBIT_CAP",
                  "type": "NET_DEBIT_CAP",
                  "value": 100
              }
          }
      }
  },
  "endpoints": {
      "FSPIOP_CALLBACK_URL_TRANSFER_POST" : {
          "type": "FSPIOP_CALLBACK_URL_TRANSFER",
          "value": "http://test"
      },
      "FSPIOP_CALLBACK_URL_QUOTES" : {
          "type": "FSPIOP_CALLBACK_URL_TRANSFER",
          "value": "http://test"
      },
      "SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL" : {
          "type": "SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL",
          "value": "joe@test.com"
      }
  }
}

const createParticipantCmd = new CreateParticipantCmd(createParticipantCmdPayload)

const start = async () => {
  await publishMessage(createParticipantCmd)
  process.exit(0)  
}

start()
