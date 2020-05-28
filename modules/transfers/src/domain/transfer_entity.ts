/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseEntityState, BaseEntity } from '@mojaloop-poc/lib-domain'

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

export class TransferState extends BaseEntityState {
  amount: number = 0
  currencyId: string = ''
  transferInternalStateId: TransferInternalState = TransferInternalState.INVALID
  payerName: string = ''
  payeeName: string = ''
}

export class TransferEntity extends BaseEntity<TransferState> {
  get amount (): number {
    return this._state.amount
  }

  get currencyId (): string {
    return this._state.currencyId
  }

  get transferInternalStateId (): TransferInternalState {
    return this._state.transferInternalStateId
  }

  get payerName (): string {
    return this._state.currencyId
  }

  get payeeName (): string {
    return this._state.currencyId
  }

  static CreateInstance (initialState?: TransferState): TransferEntity {
    initialState = initialState ?? new TransferState()

    const entity: TransferEntity = new TransferEntity(initialState)

    return entity
  }

  setupInitialState (amount: number, currencyId: string, payerName: string, payeeName: string): void{
    this._state.amount = amount
    this._state.currencyId = currencyId
    this._state.payerName = payerName
    this._state.payeeName = payeeName
    this._state.transferInternalStateId = TransferInternalState.RECEIVED_PREPARE
  }


/*
  canReserveFunds (amount: number): boolean {
    if (amount <= 0) { return false }

    return (this._state.position + amount) < this._state.limit
  }

  reserveFunds (amount: number): void{
    this._state.position -= amount
  }

  reverseFundReservation (amount: number): void{
    this._state.position += amount
  }*/
}
