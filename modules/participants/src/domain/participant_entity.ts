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

import { BaseEntityState, BaseEntity } from '@mojaloop-poc/lib-domain'

export class ParticipantState extends BaseEntityState {
  limit: number = 0
  position: number = 0
  name: string = ''
}

export class ParticipantEntity extends BaseEntity<ParticipantState> {
  get limit (): number {
    return this._state.limit
  }

  get position (): number {
    return this._state.position
  }

  get name (): string {
    return this._state.name
  }

  static CreateInstance (initialState?: ParticipantState): ParticipantEntity {
    initialState = initialState ?? new ParticipantState()

    const entity: ParticipantEntity = new ParticipantEntity(initialState)

    return entity
  }

  setupInitialState (name: string, limit: number, initialPosition: number): void{
    this._state.name = name
    this._state.limit = limit
    this._state.position = initialPosition
  }

  canReserveFunds (amount: number): boolean {
    if (amount <= 0) { return false }

    return (this._state.position + amount) < this._state.limit
  }

  reserveFunds (amount: number): void{
    this._state.position -= amount
  }

  reverseFundReservation (amount: number): void{
    this._state.position += amount
  }
}
