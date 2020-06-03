/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseEntityState, BaseEntity } from '@mojaloop-poc/lib-domain'

export enum TransferInternalStates {
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

export class TransferState extends BaseEntityState {
  transferId: string = ''
  amount: number = 0
  currency: string = ''
  TransferInternalStates: TransferInternalStates = TransferInternalStates.INVALID
  payerId: string = ''
  payeeId: string = ''
}

export class TransferEntity extends BaseEntity<TransferState> {
  get transferId (): string {
    return this._state.transferId
  }

  get amount (): number {
    return this._state.amount
  }

  get currencyId (): string {
    return this._state.currency
  }

  get TransferInternalStates (): TransferInternalStates {
    return this._state.TransferInternalStates
  }

  get payerId (): string {
    return this._state.payerId
  }

  get payeeId (): string {
    return this._state.payeeId
  }

  static CreateInstance (initialState?: TransferState): TransferEntity {
    initialState = initialState ?? new TransferState()

    const entity: TransferEntity = new TransferEntity(initialState)

    return entity
  }

  setupInitialState (initialState: TransferState): void {
    this._state = { ...initialState }
  }

  changeStateTo (newState: TransferInternalStates): void {
    this._state.TransferInternalStates = newState
  }
}
