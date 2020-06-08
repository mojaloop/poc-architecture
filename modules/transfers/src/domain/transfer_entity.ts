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
  amount: number = 0
  currency: string = ''
  transferInternalState: TransferInternalStates = TransferInternalStates.INVALID
  payerId: string = ''
  payeeId: string = ''
}

export interface PrepareTransferData {
  id: string
  amount: number
  currency: string
  payerId: string
  payeeId: string
}

export class TransferEntity extends BaseEntity<TransferState> {
  get amount (): number {
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

  prepareTransfer (incominmgTransfer: PrepareTransferData): void {
    this._state.id = incominmgTransfer.id
    this._state.amount = incominmgTransfer.amount
    this._state.currency = incominmgTransfer.currency
    this._state.payerId = incominmgTransfer.payerId
    this._state.payeeId = incominmgTransfer.payeeId
    this._state.transferInternalState = TransferInternalStates.RECEIVED_PREPARE
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
