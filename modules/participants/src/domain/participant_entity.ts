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
import { CurrencyTypes, AccountLimitTypes, ParticipantAccountTypes } from '@mojaloop-poc/lib-public-messages'

export class InvalidAccountError extends Error {}
export class InvalidLimitError extends Error {}
export class NetDebitCapLimitExceededError extends Error {}

export class ParticipantLimitState extends BaseEntityState {
  type: AccountLimitTypes
  value: number // TODO: these need to be replaced to support 64bit floating point precission
}

export class ParticipantAccountState extends BaseEntityState {
  type: ParticipantAccountTypes
  currency: CurrencyTypes
  position: number // TODO: these need to be replaced to support 64bit floating point precission
  initialPosition: number // TODO: these need to be replaced to support 64bit floating point precission
  limits: ParticipantLimitState[]
}

export class ParticipantEndpointState extends BaseEntityState {
  type: string
  value: string
}

export class ParticipantState extends BaseEntityState {
  id: string
  name: string
  accounts: ParticipantAccountState[]
  endpoints: ParticipantEndpointState[]
}

export class ParticipantEntity extends BaseEntity<ParticipantState> {
  get id (): string {
    return this._state.id
  }

  get name (): string {
    return this._state.name
  }

  get accounts (): ParticipantAccountState[] {
    return this._state.accounts
  }

  get endpoints (): ParticipantEndpointState[] {
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

  private getAccount (accType: ParticipantAccountTypes, currency: CurrencyTypes): ParticipantAccountState | null {
    if (accType == null || currency == null) return null
    const accountState = this._state?.accounts?.find(account => account.type === accType && account.currency === currency)
    if (accountState == null) return null
    return accountState
  }

  private getLimit (accType: ParticipantAccountTypes, currency: CurrencyTypes, limitType: AccountLimitTypes): ParticipantLimitState | null {
    if (accType != null && currency != null && limitType != null) {
      const accountState = this.getAccount(accType, currency)
      if (accountState != null) { return this.getLimitFromAccount(accountState, limitType) }
    }
    return null
  }

  private getLimitFromAccount (account: ParticipantAccountState, limitType: AccountLimitTypes): ParticipantLimitState | null {
    if (account != null && limitType != null) {
      const limitState = account?.limits?.find(limit => limit.type === limitType)
      if (limitState == null) return null
      return limitState
    }
    return null
  }

  hasAccount (accType: ParticipantAccountTypes, currency: CurrencyTypes): boolean {
    return this.getAccount(accType, currency) != null
  }

  hasPositionAccount (currency: CurrencyTypes): boolean {
    return this.getAccount(ParticipantAccountTypes.POSITION, currency) != null
  }

  private getEndpoint (type: string): ParticipantEndpointState | null {
    if (type == null) return null
    const endpointState = this._state?.endpoints?.find(endpoint => endpoint.type === type)
    if (endpointState == null) return null
    return endpointState
  }

  private canReserveFunds (currency: CurrencyTypes, amount: number): boolean {
    if (amount <= 0) { return false }
    const accountState = this.getAccount(ParticipantAccountTypes.POSITION, currency)
    if (accountState == null) throw new InvalidAccountError(`Unable to 'canReserveFunds' - Unknown account '${currency}' for Account '${this.id}'`)
    const limitValue = this.getLimitFromAccount(accountState, AccountLimitTypes.NET_DEBIT_CAP)?.value
    if (limitValue == null) throw new InvalidLimitError(`Unable to 'canReserveFunds' - Unknown limitType '${AccountLimitTypes.NET_DEBIT_CAP}' for Account '${this.id}'`)
    return (accountState.position + amount) < limitValue
  }

  commitFunds (currency: CurrencyTypes, amount: number): void {
    const account = this.getAccount(ParticipantAccountTypes.POSITION, currency)
    if (account == null) throw new InvalidAccountError(`Unable to 'canReserveFunds' - Unknown account '${currency}' for Account '${this.id}'`)
    account.position -= amount
  }

  reserveFunds (currency: CurrencyTypes, amount: number): void {
    if (this.canReserveFunds(currency, amount)) {
      const accountState = this.getAccount(ParticipantAccountTypes.POSITION, currency)
      accountState!.position += amount
    } else {
      throw new NetDebitCapLimitExceededError(`Unable to 'reserveFunds' - amount '${amount}' exceeded limit '${AccountLimitTypes.NET_DEBIT_CAP}' for Account '${this.id}'`)
    }
  }

  getCurrentPosition (currency: CurrencyTypes): number {
    const accountState = this.getAccount(ParticipantAccountTypes.POSITION, currency)
    if (accountState == null) throw new InvalidAccountError(`Unable to 'canReserveFunds' - Unknown account '${currency}' for Account '${this.id}'`)
    return accountState.position
  }
}
