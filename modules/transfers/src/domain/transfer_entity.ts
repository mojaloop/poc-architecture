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
  amount: string
  currency: string
  transferInternalState: TransferInternalStates
  payerId: string
  payeeId: string
  expiration: string
  condition: string
  prepare: {
    headers: {[key: string]: string}
    payload: string
  }
}

export type PrepareTransferData = {
  id: string
  amount: string
  currency: string
  payerId: string
  payeeId: string
  expiration: string
  condition: string
  prepare: {
    headers: {[key: string]: string}
    payload: string
  }
}

export class TransferEntity extends BaseEntity<TransferState> {
  get amount (): string {
    return this._state.amount
  }

  get currency (): string {
    return this._state.currency
  }

  get transferInternalState (): TransferInternalStates {
    return this._state.transferInternalState
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

  prepareTransfer (incommingTransfer: PrepareTransferData): void {
    this._state.id = incommingTransfer.id
    this._state.amount = incommingTransfer.amount
    this._state.currency = incommingTransfer.currency
    this._state.payerId = incommingTransfer.payerId
    this._state.payeeId = incommingTransfer.payeeId
    this._state.transferInternalState = TransferInternalStates.RECEIVED_PREPARE
    this._state.expiration = incommingTransfer.expiration
    this._state.condition = incommingTransfer.condition
    this._state.prepare = {
      headers: incommingTransfer.prepare?.headers,
      payload: incommingTransfer.prepare?.payload
    }
  }

  acknowledgeTransferReserved (): void {
    this._state.transferInternalState = TransferInternalStates.RESERVED
  }

  fulfilTransfer (): void {
    this._state.transferInternalState = TransferInternalStates.RECEIVED_FULFIL
  }

  commitTransfer (): void {
    this._state.transferInternalState = TransferInternalStates.COMMITTED
  }
}
