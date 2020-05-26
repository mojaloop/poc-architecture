/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

// import { BaseEntity } from './base_entity'
import { BaseEntityState } from './base_entity_state'

export interface IEntityStateRepository<S extends BaseEntityState>{
  init: () => Promise<void>
  destroy: () => Promise<void>
  canCall: () => boolean // for circuit breaker

  load: (id: string) => Promise<S | null>
  store: (entityState: S) => Promise<void>
  remove: (id: string) => Promise<void>
}
