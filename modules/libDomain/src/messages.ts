/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */
'use strict'
import { v4 as uuidv4 } from 'uuid'

// base stuff, can be used for other messaging objects like logging or tracing

export enum MessageTypes{
  'STATE_EVENT' =0, // for private event-sourcing events
  'DOMAIN_EVENT', // public domain events
  'COMMAND', // commands
}

export interface IMessage{
  msgType: MessageTypes
  msgId: string // unique per message
  msgTimestamp: number
  msgKey: string // usually the id of the aggregate (used for partitioning)
  msgTopic: string

  // TODO: for later

  // source_system_name:string // source system name
  // source_system_instance_id:string // source system name instance id
  //
  // correlation_id:string // transaction id, gets passed to other systems

  payload: any
}

// domain specific

export interface IDomainMessage extends IMessage{
  msg_name: string // name of the event or command

  aggregate_name: string // name of the source/target aggregate (source if event, target if command)
  aggregateId: string // id of the source/target aggregate (source if event, target if command)
  // aggregate_version:number; // version of the source/target aggregate (source if event, target if command)
}

export abstract class DomainMsg implements IDomainMessage {
  msgId: string = uuidv4() // unique per message
  msgTimestamp: number = Date.now()
  msg_name: string = (this as any).constructor.name

  abstract msgType: MessageTypes
  abstract msgKey: string // usually the id of the aggregate (used for partitioning)
  abstract msgTopic: string

  abstract aggregateId: string
  abstract aggregate_name: string
  // abstract aggregate_version: number;

  abstract payload: any
}

export abstract class DomainEventMsg extends DomainMsg {
  msgType: MessageTypes = MessageTypes.DOMAIN_EVENT
}

export abstract class CommandMsg extends DomainMsg {
  msgType: MessageTypes = MessageTypes.COMMAND
}
