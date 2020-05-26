/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { IEntityFactory } from '@mojaloop-poc/lib-domain'
import { ParticipantEntity, ParticipantState } from './participant_entity'

export class ParticipantsFactory implements IEntityFactory<ParticipantEntity, ParticipantState> {
  // singleton
  private static _instance: ParticipantsFactory
  static GetInstance (): ParticipantsFactory {
    if (this._instance == null) { this._instance = new ParticipantsFactory() }

    return this._instance
  }

  private constructor () {}

  create (): ParticipantEntity {
    return ParticipantEntity.CreateInstance(new ParticipantState())
  }

  createFromState (initialState: ParticipantState): ParticipantEntity {
    return ParticipantEntity.CreateInstance(initialState)
  }

  createWithId (initialId: string): ParticipantEntity {
    const initialState: ParticipantState = new ParticipantState()
    initialState.id = initialId

    return ParticipantEntity.CreateInstance(initialState)
  }
}
