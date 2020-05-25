/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

"use strict";

import {IMessage} from "./messages";

export interface IMessagePublisher{
	init():Promise<void>;
	destroy():Promise<void>;

	publish(message:IMessage):Promise<void>;
	publish_many(messages:IMessage[]):Promise<void>;
}
