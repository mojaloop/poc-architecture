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

import * as redis from 'redis'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ParticipantAccountState, ParticipantAccountStateListType, ParticipantEndpointState, ParticipantEndpointStateListType, ParticipantState } from '../domain/participant_entity'
import { IParticipantRepo } from '../domain/participant_repo'
import { ParticipantAccountTypes } from '@mojaloop-poc/lib-public-messages'
// @ts-expect-error
import RedisClustr = require('redis-clustr')

export class CachedPersistedRedisHashSetParticipantStateRepo implements IParticipantRepo {
  protected _redisClient!: redis.RedisClient
  protected _redisClustered: boolean
  private readonly _redisConnStr: string
  private readonly _redisConnClusterHost: string
  private readonly _redisConnClusterPort: number
  private readonly _inMemorylist: Map<string, ParticipantState> = new Map<string, ParticipantState>()
  private readonly _logger: ILogger
  private _initialized: boolean = false
  private readonly keyPrefix: string = 'participant_'

  constructor (connStr: string, clusteredRedis: boolean, logger: ILogger) {
    this._redisConnStr = connStr
    this._logger = logger
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
        this._logger.isInfoEnabled() && this._logger.info('Redis client ready')
        if (this._initialized) { return }

        this._initialized = true
        return resolve()
      })

      this._redisClient.on('error', (err) => {
        this._logger.isErrorEnabled() && this._logger.error(err, 'A redis error has occurred:')
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

  async load (id: string): Promise<ParticipantState | null> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(id)

      if (this._inMemorylist.has(key)) {
        return resolve(this._inMemorylist.get(key)!)
      }

      this._redisClient.hgetall(key, (err: Error | null, reply: { [key: string]: string } | null) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'Error fetching entity state from redis - for key: ' + key)
          return reject(err)
        }
        if (reply == null) {
          this._logger.isDebugEnabled() && this._logger.debug('Entity state not found in redis - for key: ' + key)
          return resolve(null)
        }
        try {
          // const state: ParticipantState = JSON.parse(reply)

          const accounts: ParticipantAccountStateListType = []
          const endpoints: ParticipantEndpointStateListType = []
          Object.entries(reply).forEach(([k, v]) => {
            if (this.isAccountKey(k)) {
              const account: ParticipantAccountState = JSON.parse(v)
              accounts.push(account)
            }

            if (this.isEndpointKey(k)) {
              const endpoint: ParticipantEndpointState = JSON.parse(v)
              endpoints.push(endpoint)
            }
          })

          const state: ParticipantState = {
            id: reply.id,
            name: reply.name,
            accounts: (accounts != null && accounts.length > 0) ? accounts : undefined,
            endpoints: (endpoints != null && endpoints.length > 0) ? endpoints : undefined,
            partition: (reply.partition != null) ? Number.parseInt(reply.partition) : null,
            created_at: Number.parseInt(reply.created_at),
            updated_at: Number.parseInt(reply.updated_at),
            version: Number.parseInt(reply.version)
          }

          this._inMemorylist.set(key, state)

          return resolve(state)
        } catch (err) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'Error parsing entity state from redis - for key: ' + key)
          return reject(err)
        }
      })
    })
  }

  async remove (id: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(id)

      if (this._inMemorylist.has(key)) {
        this._inMemorylist.delete(key)
      }

      this._redisClient.del(key, (err?: Error|null, result?: number) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'Error removing entity state from redis - for key: ' + key)
          return reject(err)
        }
        if (result !== 1) {
          this._logger.isDebugEnabled() && this._logger.debug('Entity state not found in redis - for key: ' + key)
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

      this._logger.isDebugEnabled() && this._logger.debug(`CachedPersistedRedisHashSetParticipantStateRepo::store - storing ${entityState.id} in-memory only, AND redis as we have not seen this participant before!`)

      this._inMemorylist.set(key, entityState)

      // Fefine an empty array for HSET Arguments
      const redisArgs: string[] = []

      if (entityState.id != null) {
        redisArgs.push('id')
        redisArgs.push(entityState.id)
      }

      if (entityState.created_at != null) {
        redisArgs.push('created_at')
        redisArgs.push(entityState.created_at.toString())
      }

      if (entityState.updated_at != null) {
        redisArgs.push('updated_at')
        redisArgs.push(entityState.updated_at.toString())
      }

      if (entityState.version != null) {
        redisArgs.push('version')
        redisArgs.push(entityState.version.toString())
      }

      if (entityState.name != null) {
        redisArgs.push('name')
        redisArgs.push(entityState.name)
      }

      if (entityState.partition != null) {
        redisArgs.push('partition')
        redisArgs.push(entityState.partition.toString())
      }

      // Check to see if we have any Accounts
      if (entityState.accounts != null) {
        // Lets store each account into the args list
        entityState.accounts.forEach(account => {
          const stringValue: string = this.stringify(key, account)
          redisArgs.push(this.accountKey(key, account))
          redisArgs.push(stringValue)
        })
        /// / Lets store all accounts into the args list
        // let stringValue: string = stringify(entityState.accounts)
        // redisArgs.push('accounts')
        // redisArgs.push(stringValue)
      }

      // Check to see if we have any Endpoints
      if (entityState.endpoints != null) {
        // Lets store each endpoint into the args list
        entityState.endpoints.forEach(endpoint => {
          const stringValue: string = this.stringify(key, endpoint)
          redisArgs.push(this.endpointKey(key, endpoint))
          redisArgs.push(stringValue)
        })
        /// / Lets store all endpoints into the args list
        // let stringValue: string = stringify(entityState.endpoints)
        // redisArgs.push('endpoints')
        // redisArgs.push(stringValue)
      }

      this._logger.isDebugEnabled() && this._logger.debug(`Attempting to store an hset in redis - for key: ${key}, args.length: ${redisArgs.length}`)
      // Check if there is something to update
      if (redisArgs.length > 0) {
        this._redisClient.hset(key, ...redisArgs, (err: Error | null, reply: number) => {
          if (err != null) {
            this._logger.isErrorEnabled() && this._logger.error(err, 'Error storing entity state to redis - for key: ' + key)
            return reject(err)
          }
          this._logger.isDebugEnabled() && this._logger.debug(`Response to storing entity state in redis - for key: ${key}; reply: ${reply}`)
          // if (reply <= 0) {
          //   this._logger.isErrorEnabled() && this._logger.error('Unsuccessful attempt to store the entity state in redis - for key: ' + key)
          //   return reject(new Error('Unsuccessful attempt to store the entity state in redis - for key: ' + key))
          // }
          return resolve()
        })
      } else {
        this._logger.isWarnEnabled() && this._logger.warn('No entity state change in redis - for key: ' + key)
      }
    })
  }

  private readonly stringify = (key: string, val: any): string => {
    let stringValue: string
    try {
      stringValue = JSON.stringify(val)
    } catch (err) {
      this._logger.isErrorEnabled() && this._logger.error(err, 'Error parsing entity state JSON - for key: ' + key)
      throw err
    }
    return stringValue
  }

  private keyWithPrefix (key: string): string {
    return this.keyPrefix + key
  }

  private readonly compositeKey = (key: string, ...args: string[]): string => {
    const reducedArgs: string = args.reduce((prev, arg, key) => {
      return prev + '_' + arg
    })
    return reducedArgs
  }

  private readonly endpointKey = (key: string, endpoint: ParticipantEndpointState): string => {
    return this.compositeKey(key, 'endpoint', endpoint.type)
  }

  private readonly accountKey = (key: string, account: ParticipantAccountState): string => {
    return this.compositeKey(key, 'account', account.type, account.currency)
  }

  private readonly isEndpointKey = (key: string): boolean => {
    return key.startsWith('endpoint')
  }

  private readonly isAccountKey = (key: string): boolean => {
    return key.startsWith('account')
  }

  async hasAccount (participantId: string, accType: ParticipantAccountTypes, currency: string): Promise<boolean> {
    const participant = await this.load(participantId)
    return participant?.accounts?.find(account => account.type === accType && account.currency === currency) != null
  }

  async getEndPoints (participantId: string): Promise<ParticipantEndpointStateListType> {
    const participant = await this.load(participantId)
    return participant?.endpoints
  }
}
