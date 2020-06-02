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
import { LIMIT_TYPES } from '../enums'

export class InvalidAccountError extends Error {}
export class InvalidLimitError extends Error {}
export class NetDebitCapLimitExceededError extends Error {}

export class ParticipantLimitState extends BaseEntityState {
  id: string
  type: string
  value: number // TODO: these need to be replaced to support 64bit floating point precission
}

export class ParticipantAccountState extends BaseEntityState {
  id: string
  currency: string
  position: number // TODO: these need to be replaced to support 64bit floating point precission
  initialPosition: number // TODO: these need to be replaced to support 64bit floating point precission
  limits: {
    [key: string]: ParticipantLimitState
  }
}

export class ParticipantEndpointState extends BaseEntityState {
  type: string
  value: string
}

export class ParticipantState extends BaseEntityState {
  id: string
  name: string
  accounts: {
    [key: string]: ParticipantAccountState
  }

  endpoints: {
    [key: string]: ParticipantEndpointState
  }
}

export class ParticipantEntity extends BaseEntity<ParticipantState> {
  get id (): string {
    return this._state.id
  }

  get name (): string {
    return this._state.name
  }

  get accounts (): { [key: string]: ParticipantAccountState } {
    return this._state.accounts
  }

  get endpoints (): { [key: string]: ParticipantEndpointState } {
    return this._state.endpoints
  }

  static CreateInstance (initialState?: ParticipantState): ParticipantEntity {
    initialState = initialState ?? new ParticipantState()

    const entity: ParticipantEntity = new ParticipantEntity(initialState)

    return entity
  }

  setupInitialState (initialState: ParticipantState): void {
    this._state = { ...initialState }
  }

  private getAccount (id: string): ParticipantAccountState | null {
    if (id == null) return null
    const accountState = this._state?.accounts[id]
    if (accountState == null) return null
    return accountState
  }

  private getLimit (currency: string, limitType: string): ParticipantLimitState | null {
    if (currency != null && limitType != null) {
      const account = this.getAccount(currency)
      if (account?.limits[limitType] != null) return account?.limits[limitType]
    }
    return null
  }

  hasAccount (currency: string): boolean {
    if (this.accounts != null && this?.accounts[currency] != null) return true
    return false
  }

  private getEndpoint (id: string): ParticipantEndpointState | null {
    if (id == null) return null
    const endpointState = this._state?.endpoints[id]
    if (endpointState == null) return null
    return endpointState
  }

  private canReserveFunds (currency: string, amount: number): boolean {
    if (amount <= 0) { return false }
    const account = this.getAccount(currency)
    if (account == null) throw new InvalidAccountError(`Unable to 'canReserveFunds' - Unknown account '${currency}' for Account '${this.id}'`)
    const limitValue = this.getLimit(currency, LIMIT_TYPES.NET_DEBIT_CAP)?.value
    if (limitValue == null) throw new InvalidLimitError(`Unable to 'canReserveFunds' - Unknown limitType '${LIMIT_TYPES.NET_DEBIT_CAP}' for Account '${this.id}'`)
    return (account.position + amount) < limitValue
  }

  commitFunds (currency: string, amount: number): void {
    const account = this.getAccount(currency)
    if (account == null) throw new InvalidAccountError(`Unable to 'canReserveFunds' - Unknown account '${currency}' for Account '${this.id}'`)
    account.position -= amount
  }

  reserveFunds (currency: string, amount: number): void {
    if (this.canReserveFunds(currency, amount)) {
      const account = this.getAccount(currency)
      account!.position += amount
    } else {
      throw new NetDebitCapLimitExceededError(`Unable to 'reserveFunds' - amount '${amount}' exceeded limit '${LIMIT_TYPES.NET_DEBIT_CAP}' for Account '${this.id}'`)
    }
  }

  getCurrentPosition (currency: string): number {
    const account = this.getAccount(currency)
    if (account == null) throw new InvalidAccountError(`Unable to 'canReserveFunds' - Unknown account '${currency}' for Account '${this.id}'`)
    return account.position
  }
}
