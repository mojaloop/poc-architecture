/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";

import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEntityState{
	created_at:number = Date.now();
	updated_at:number = Date.now();
	version: number = 0;

	id: string = uuidv4();
}
