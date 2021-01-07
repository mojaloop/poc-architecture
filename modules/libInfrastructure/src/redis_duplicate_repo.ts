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

// import * as redis from 'redis'
import { ILogger, IEntityDuplicateRepository } from '@mojaloop-poc/lib-domain'
import * as redis from 'redis'
// @ts-expect-error
import RedisClustr = require('redis-clustr')

export class RedisDuplicateRepo implements IEntityDuplicateRepository {
  protected _redisClient!: redis.RedisClient
  protected _redisClustered: boolean
  private readonly _redisConnStr: string
  private readonly _redisConnClusterHost: string
  private readonly _redisConnClusterPort: number
  private readonly _logger: ILogger
  private _initialized: boolean = false
  private readonly _setKey: string

  constructor (connStr: string, clusteredRedis: boolean, setKey: string, logger: ILogger) {
    this._redisConnStr = connStr
    this._logger = logger
    this._setKey = setKey
    this._redisClustered = clusteredRedis

    const splited = connStr.split('//')[1]
    this._redisConnClusterHost = splited.split(':')[0]
    this._redisConnClusterPort = Number.parseInt(splited.split(':')[1])
  }

  async init (): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (this._redisClustered) {
        this._redisClient = new RedisClustr({
          servers: [{ host: this._redisConnClusterHost, port: this._redisConnClusterPort }]
        })
      } else {
        this._redisClient = redis.createClient({ url: this._redisConnStr })
      }

      this._redisClient.on('ready', () => {
        this._logger.isDebugEnabled() && this._logger.debug('Redis client ready')
        if (this._initialized) { return }
        this._initialized = true
        return resolve()
      })

      this._redisClient.on('error', (err: Error) => {
        this._logger.isErrorEnabled() && this._logger.error(err, 'A redis error has occurred:')
        if (!this._initialized) { return reject(err) }
      })
    })
  }

  async add (id: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))
      this._redisClient.sadd(this._setKey, id, (err: Error | null, result: number) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, `Error storing '${id}' for set to redis: ${this._setKey}`)
          return reject(err)
        }
        if (result === 1) {
          return resolve(true)
        } else {
          return resolve(false)
        }
      })
    })
  }

  async exists (id: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))
      this._redisClient.sismember(this._setKey, id, (err: Error | null, result: number) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, `Error checking '${id}' for set to redis: ${this._setKey}`)
          return reject(err)
        }
        if (result === 1) {
          return resolve(true)
        } else {
          return resolve(false)
        }
      })
    })
  }

  async remove (id: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))
      this._redisClient.srem(this._setKey, id, (err: Error | null, result: number) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, `Error removing '${id}' from set to redis: ${this._setKey}`)
          return reject(err)
        }
        if (result === 1) {
          return resolve(true)
        } else {
          return resolve(false)
        }
      })
    })
  }

  async getAll (): Promise<string[]> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))
      this._redisClient.smembers(this._setKey, (err: Error | null, result: string[]) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, `Error retrieving all members of redis set: ${this._setKey}`)
          return reject(err)
        }

        return resolve(result)
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
}
