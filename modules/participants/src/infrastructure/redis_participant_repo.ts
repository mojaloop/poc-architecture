/**
 * Created by pedrosousabarreto@gmail.com on 24/May/2020.
 */

'use strict'

import * as redis from 'redis'
import { IEntityStateRepository } from '@mojaloop-poc/lib-domain'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ParticipantState } from '../domain/participant_entity'

export class RedisParticipantStateRepo implements IEntityStateRepository<ParticipantState> {
  protected _redisClient!: redis.RedisClient
  private readonly _redisConnStr: string
  private readonly _logger: ILogger
  private _initialized: boolean = false
  private readonly keyPrefix: string = 'participant_'

  constructor (connStr: string, logger: ILogger) {
    this._redisConnStr = connStr
    this._logger = logger
  }

  async init (): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._redisClient = redis.createClient({ url: this._redisConnStr })

      this._redisClient.on('ready', () => {
        this._logger.info('Redis client ready')
        if (this._initialized) { return }

        this._initialized = true
        return resolve()
      })

      this._redisClient.on('error', (err) => {
        this._logger.error(err, 'A redis error has occurred:')
        if (!this._initialized) { return reject(err) }
      })
    })
  }

  async destroy (): Promise<void> {
    if (this._initialized) { this._redisClient.quit() }

    return await Promise.resolve()
  }

  canCall (): boolean {
    return this._initialized // for now, no circuit breaker exists
  }

  async load (id: string): Promise<ParticipantState|null> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(id)

      this._redisClient.get(key, (err?: Error|null, result?: string) => {
        if (err != null) {
          this._logger.error(err, 'Error fetching entity state from redis - for key: ' + key)
          return reject(err)
        }
        if (result == null) {
          this._logger.debug('Entity state not found in redis - for key: ' + key)
          return resolve(null)
        }
        try {
          const state: ParticipantState = JSON.parse(result)
          return resolve(state)
        } catch (err) {
          this._logger.error(err, 'Error parsing entity state from redis - for key: ' + key)
          return reject(err)
        }
      })
    })
  }

  async remove (id: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(id)

      this._redisClient.del(key, (err?: Error|null, result?: number) => {
        if (err != null) {
          this._logger.error(err, 'Error removing entity state from redis - for key: ' + key)
          return reject(err)
        }
        if (result !== 1) {
          this._logger.debug('Entity state not found in redis - for key: ' + key)
          return resolve()
        }

        return resolve()
      })
    })
  }

  async store (entityState: ParticipantState): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(entityState.id)
      let stringValue: string
      try {
        stringValue = JSON.stringify(entityState)
      } catch (err) {
        this._logger.error(err, 'Error parsing entity state JSON - for key: ' + key)
        return reject(err)
      }

      this._redisClient.set(key, stringValue, (err: Error | null, reply: string) => {
        if (err != null) {
          this._logger.error(err, 'Error storing entity state to redis - for key: ' + key)
          return reject(err)
        }
        if (reply !== 'OK') {
          this._logger.error('Unsuccessful attempt to store the entity state in redis - for key: ' + key)
          return reject(err)
        }
        return resolve()
      })
    })
  }

  private keyWithPrefix (key: string): string {
    return this.keyPrefix + key
  }
}
