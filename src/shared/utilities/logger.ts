/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";

export interface ILogger {
	// trace(...anything);
	debug(message?: any, ...optionalParams: any[]):void;
	info(message?: any, ...optionalParams: any[]):void;
	warn(message?: any, ...optionalParams: any[]):void;
	error(message?: any, ...optionalParams: any[]):void;
	fatal(message?: any, ...optionalParams: any[]):void;
}


export class ConsoleLogger implements ILogger {
	// trace(...anything) {
	// 	console.trace.apply(this, anything);
	// }

	debug(message?: any, ...optional: any[]) {
		// @ts-ignore
		console.log.apply(this, arguments);
	}

	info(message?: any, ...optionalParams: any[]) {
		// @ts-ignore
		console.info.apply(this, arguments);
	}

	warn(message?: any, ...optional: any[]) {
		// @ts-ignore
		console.warn.apply(this, arguments);
	}

	error(message?: any, ...optional: any[]) {
		// @ts-ignore
		console.error.apply(this, arguments);
	}

	fatal(message?: any, ...optional: any[]) {
		// @ts-ignore
		console.error.apply(this, rguments);
	}
}
