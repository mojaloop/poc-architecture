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
