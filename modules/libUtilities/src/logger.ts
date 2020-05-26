/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'


import {ILogger} from '@mojaloop-poc/lib-domain'

export class ConsoleLogger implements ILogger {
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
