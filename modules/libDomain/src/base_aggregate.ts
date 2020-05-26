/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

'use strict'

import { BaseEntity } from './base_entity'
import { BaseEntityState } from './base_entity_state'
import { CommandMsg, DomainEventMsg, IDomainMessage } from './messages'
import { IMessagePublisher } from './imessage_publisher'
import { IEntityStateRepository } from './ientity_state_repository'
import { IEntityFactory } from './entity_factory'
import { ConsoleLogger, ILogger } from '@mojaloop-poc/lib-utilities'

export abstract class BaseAggregate<E extends BaseEntity<S>, S extends BaseEntityState> {
  protected _logger: ILogger
  // private _event_handlers: Map<string, (event:DomainEventMsg)=>Promise<void>>;
  private readonly _commandHandlers: Map<string, (cmd: CommandMsg) => Promise<boolean>>

  private _uncommittedEvents: DomainEventMsg[]
  protected _rootEntity: E | null

  protected _entity_factory: IEntityFactory<E, S>
  protected _msgPublisher: IMessagePublisher
  protected _entity_state_repo: IEntityStateRepository<S>

  constructor (entityFactory: IEntityFactory<E, S>, entityStateRepo: IEntityStateRepository<S>, msgPublisher: IMessagePublisher, logger?: ILogger) {
    this._logger = logger ?? new ConsoleLogger()

    // this._event_handlers = new Map<string, (event:DomainEventMsg, replayed?:boolean)=>Promise<void>>();
    this._commandHandlers = new Map<string, (cmd: CommandMsg) => Promise<boolean>>()
    this._uncommittedEvents = []
    this._rootEntity = null

    this._entity_factory = entityFactory

    this._entity_state_repo = entityStateRepo
    this._msgPublisher = msgPublisher
  }

  /*
  # Commented out as it causes the following lint error `error  Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises`. See below alternative implementation to fix linting issue.
  */
  // async processCommand (commandMsg: CommandMsg): Promise<boolean> {
  //   return new Promise(async (resolve, reject) => {
  //     const handler = this._commandHandlers.get(commandMsg.msg_name)
  //     if (handler == null) {
  //       return reject(new Error(`Aggregate doesn't have a handler for a command with name ${commandMsg.msg_name}`))
  //     }

  //     this._resetState()
  //     // the local cmd handler code must either load or create the aggregate

  //     // TODO check for consistency, ie, versions
  //     await handler.call(this, commandMsg).then(async (result: boolean) => {
  //       await this.commit() // send out the unpublished events regardless

  //       // until we have full event sourcing we have to persist
  //       if (!result) {
  //         this._logger.info(`Command '${commandMsg.msg_name}' execution failed`)
  //         return reject(new Error(`Command '${commandMsg.msg_name}' execution failed`))
  //       }

  //       if (this._rootEntity != null) {
  //         await this._entity_state_repo.store(this._rootEntity.exportState())
  //       } else {
  //         return reject(new Error(`Aggregate doesn't have a valid state to process command with name ${commandMsg.msg_name}`))
  //       }
  //       this._logger.info(`Aggregate state persisted to repository at the end of command: ${commandMsg.msg_name}`)
  //       return resolve(true)
  //     }).catch(async (err: any) => {
  //       await this.commit() // we still send out the unpublished events
  //       this._logger.error(err, `Aggregate state persited to repoistory at the end of command: ${commandMsg.msg_name}`)

  //       reject(err)
  //     })
  //   })
  // }

  async processCommand (commandMsg: CommandMsg): Promise<boolean> {
    const handler = this._commandHandlers.get(commandMsg.msg_name)
    if (handler == null) {
      throw new Error(`Aggregate doesn't have a handler for a command with name ${commandMsg.msg_name}`)
    }

    this._resetState()
    // the local cmd handler code must either load or create the aggregate

    // TODO check for consistency, ie, versions
    return await handler.call(this, commandMsg).then(async (result: boolean) => {
      await this.commit() // send out the unpublished events regardless

      // until we have full event sourcing we have to persist
      if (!result) {
        this._logger.info(`Command '${commandMsg.msg_name}' execution failed`)
        return false
      }

      if (this._rootEntity != null) {
        await this._entity_state_repo.store(this._rootEntity.exportState())
      } else {
        throw new Error(`Aggregate doesn't have a valid state to process command with name ${commandMsg.msg_name}`)
      }
      this._logger.info(`Aggregate state persisted to repository at the end of command: ${commandMsg.msg_name}`)
      return true
    }).catch(async (err: any) => {
      await this.commit() // we still send out the unpublished events
      this._logger.error(err, `Aggregate state persited to repoistory at the end of command: ${commandMsg.msg_name}`)
      throw err
    })
  }

  /* protected _register_event_handler(event_name:string, handler:(event:DomainEventMsg, replayed?:boolean)=>Promise<void>){
     this._event_handlers.set(event_name, handler);
  } */

  protected _registerCommandHandler (cmdName: string, handler: (event: CommandMsg) => Promise<boolean>): void {
    this._commandHandlers.set(cmdName, handler)
  }

  /* private apply_event(event_msg: DomainEventMsg, replayed?: boolean): Promise<void>{
     return new Promise(async(resolve, reject)=>{
       const handler: ((event: DomainEventMsg, replayed?:boolean) => Promise<void>) | undefined = this._event_handlers.get(event_msg.header.msg_name);
       if (!handler)
         return reject("Aggregate doesn't have a handler for event with name" +  event_msg.header.msg_name);
       // TODO check for consistency, ie, versions
       await handler(event_msg, replayed).then(()=>{
         resolve()
       }).catch((err)=>{
         reject(err);
       });
    });
  }

  private async apply_events(event_msgs: DomainEventMsg[], replayed?: boolean): Promise<void> {
    const promises = event_msgs.map(evt => this.apply_event(evt));

    return Promise.all(promises).then(()=> Promise.resolve());
  } */

  protected create (id?: string): void{
    this._resetState()
    this._rootEntity = (id != null) ? this._entity_factory.createWithId(id) : this._entity_factory.create()
  }

  /*
  # Commented out as it causes the following lint error `error  Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises`. See below alternative implementation to fix linting issue.
  */
  // protected async load (aggregateId: string, throwOnNotFound: boolean = true): Promise<void> {
  //   return await new Promise(async (resolve, reject) => {
  //     this._resetState()

  //     // TODO implement load from snapshot events and state events, using a state events repository

  //     if (this._entity_state_repo.canCall() == null) {
  //       this._logger.error('Aggregate repository not available to be called')
  //       return reject(new Error('Aggregate repository not available to be called')) // TODO typify these errors
  //     }

  //     const entityState = await this._entity_state_repo.load(aggregateId)
  //     if (entityState == null && throwOnNotFound) {
  //       this._logger.debug(`Aggregate with id: ${aggregateId} not found`)
  //       return reject(new Error('Aggregate not found')) // TODO typify these errors
  //     }

  //     if (entityState != null) {
  //       this._rootEntity = this._entity_factory.createFromState(entityState)
  //     }

  //     // the reset_state() above already sets the root_entity to null
  //     resolve()
  //   })
  // }

  protected async load (aggregateId: string, throwOnNotFound: boolean = true): Promise<void> {
    this._resetState()

    // TODO implement load from snapshot events and state events, using a state events repository

    if (this._entity_state_repo.canCall() == null) {
      this._logger.error('Aggregate repository not available to be called')
      throw new Error('Aggregate repository not available to be called') // TODO typify these errors
    }

    const entityState = await this._entity_state_repo.load(aggregateId)
    if (entityState == null && throwOnNotFound) {
      this._logger.debug(`Aggregate with id: ${aggregateId} not found`)
      throw new Error('Aggregate not found') // TODO typify these errors
    }

    if (entityState != null) {
      this._rootEntity = this._entity_factory.createFromState(entityState)
    }
    // the reset_state() above already sets the root_entity to null
  }

  protected recordDomainEvent (event: IDomainMessage): void{
    this._uncommittedEvents.push(event)
  }

  /*
  # Commented out as it causes the following lint error `error  Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises`. See below alternative implementation to fix linting issue.
  */
  // protected async commit (): Promise<void> {
  //   return await new Promise(async (resolve, reject) => {
  //     if (this._uncommittedEvents.length <= 0) {
  //       this._logger.warn('Called aggregate commit without uncommitted events to commit')
  //       return resolve()
  //     }

  //     const eventNames = this._uncommittedEvents.map(evt => evt.msg_name)

  //     await this._msgPublisher.publishMany(this._uncommittedEvents)

  //     this._logger.debug(`Aggregate committed ${this._uncommittedEvents.length} events - ${JSON.stringify(eventNames)}`)

  //     this._uncommittedEvents = []
  //     resolve()
  //   })
  // }

  protected async commit (): Promise<void> {
    if (this._uncommittedEvents.length <= 0) {
      this._logger.warn('Called aggregate commit without uncommitted events to commit')
      return
    }

    const eventNames = this._uncommittedEvents.map(evt => evt.msg_name)

    await this._msgPublisher.publishMany(this._uncommittedEvents)

    this._logger.debug(`Aggregate committed ${this._uncommittedEvents.length} events - ${JSON.stringify(eventNames)}`)

    this._uncommittedEvents = []
  }

  private _resetState (): void {
    this._uncommittedEvents = []
    this._rootEntity = null
  }
}
