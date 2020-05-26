/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { IEntityStateRepository } from '@mojaloop-poc/lib-domain'
import { ParticipantState } from '../domain/participant_entity'

export class InMemoryParticipantStateRepo implements IEntityStateRepository<ParticipantState> {
  private readonly _list: Map<string, ParticipantState> = new Map<string, ParticipantState>()

  async init (): Promise<void> {
    return await Promise.resolve()
  }

  async destroy (): Promise<void> {
    return await Promise.resolve()
  }

  canCall (): boolean {
    return true
  }

  async load (id: string): Promise<ParticipantState|null> {
    return await new Promise((resolve, reject) => {
      if (!this._list.has(id)) { resolve(null) }

      resolve(this._list.get(id))
    })
  }

  async remove (id: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this._list.has(id)) { return reject(new Error('Not found')) } // maybe fail silently?

      this._list.delete(id)
      resolve()
    })
  }

  async store (entityState: ParticipantState): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._list.set(entityState.id, entityState)
      resolve()
    })
  }
}
