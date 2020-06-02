/**
 * Created by pedrosousabarreto@gmail.com on 29/May/2020.
 */

"use strict";

// just for the tests, we don't want to depend on the external logger
import {ILogger} from "../../../src/ilogger";

export class SimpleLogger implements ILogger {
  // trace(...anything) {
  //  console.trace.apply(this, anything);
  // }

  debug (message?: any, ...optional: any[]): void {
    // @ts-expect-error
    console.log.apply(this, arguments)
  }

  info (message?: any, ...optionalParams: any[]): void {
    // @ts-expect-error
    console.info.apply(this, arguments)
  }

  warn (message?: any, ...optional: any[]): void {
    // @ts-expect-error
    console.warn.apply(this, arguments)
  }

  error (message?: any, ...optional: any[]): void {
    // @ts-expect-error
    console.error.apply(this, arguments)
  }

  fatal (message?: any, ...optional: any[]): void {
    // @ts-expect-error
    console.error.apply(this, arguments)
  }
}
