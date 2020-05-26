/**
 * Created by pedrosousabarreto@gmail.com on 26/May/2020.
 */
'use strict'

export interface ILogger {
  // trace(...anything);
  debug: (message?: any, ...optionalParams: any[]) => void
  info: (message?: any, ...optionalParams: any[]) => void
  warn: (message?: any, ...optionalParams: any[]) => void
  error: (message?: any, ...optionalParams: any[]) => void
  fatal: (message?: any, ...optionalParams: any[]) => void
}
