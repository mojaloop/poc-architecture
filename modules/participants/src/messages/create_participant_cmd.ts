/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Coil
 - Donovan Changfoot <donovan.changfoot@coil.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'

import { CommandMsg, MessageTypes } from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics } from '@mojaloop-poc/lib-public-messages'

export interface ParticipantLimit {
  id: string
  type: string
  value: number // TODO: these need to be replaced to support 64bit floating point precission
}

export interface ParticipantAccount {
  id: string
  currency: string
  position: number // TODO: these need to be replaced to support 64bit floating point precission
  initialPosition: number // TODO: these need to be replaced to support 64bit floating point precission
  limits: {
    [key: string]: ParticipantLimit
  }
}

export interface ParticipantEndpoint {
  type: string
  value: string
}

export interface CreateParticipantCmdPayload {
  id: string
  name: string
  accounts: {
    [key: string]: ParticipantAccount
  }
  endpoints: {
    [key: string]: ParticipantEndpoint
  }
}

export class CreateParticipantCmd extends CommandMsg {
  msgType: MessageTypes
  msgKey: string // usually the id of the aggregate (used for partitioning)
  msgTopic: string = ParticipantsTopics.Commands

  aggregateId: string
  aggregateName: string = 'Participants'

  payload: CreateParticipantCmdPayload

  constructor (payload: CreateParticipantCmdPayload) {
    super()

    this.aggregateId = this.msgKey = payload.id

    this.payload = payload
  }

  validatePayload (): void{ }
}
