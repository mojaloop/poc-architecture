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

// TODO: Move to config management in future
export enum ParticipantsTopics {
  'Commands' = 'ParticipantCommands',
  'DomainEvents' = 'ParticipantDomainEvents',
  // "StateEvents" = "ParticipantStateEvents"
}

export enum ParticipantAccountTypes {
  POSITION = 'POSITION',
  SETTLEMENT = 'SETTLEMENT',
  HUB_RECONCILIATION = 'HUB_RECONCILIATION',
  HUB_MULTILATERAL_SETTLEMENT = 'HUB_MULTILATERAL_SETTLEMENT',
  HUB_FEE = 'HUB_FEE',
  INTERCHANGE_FEE = 'INTERCHANGE_FEE'
}

export enum TransfersTopics {
  'Commands' = 'TransferCommands',
  'DomainEvents' = 'TransferDomainEvents',
}

export enum TransferInternalState {
  ABORTED_ERROR = 'ABORTED_ERROR',
  ABORTED_REJECTED = 'ABORTED_REJECTED',
  COMMITTED = 'COMMITTED',
  EXPIRED_PREPARED = 'EXPIRED_PREPARED',
  EXPIRED_RESERVED = 'EXPIRED_RESERVED',
  FAILED = 'FAILED',
  INVALID = 'INVALID',
  RECEIVED_ERROR = 'RECEIVED_ERROR',
  RECEIVED_FULFIL = 'RECEIVED_FULFIL',
  RECEIVED_PREPARE = 'RECEIVED_PREPARE',
  RECEIVED_REJECT = 'RECEIVED_REJECT',
  RESERVED = 'RESERVED',
  RESERVED_TIMEOUT = 'RESERVED_TIMEOUT'
}
