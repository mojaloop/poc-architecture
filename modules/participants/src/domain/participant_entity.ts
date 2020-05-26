/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

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
