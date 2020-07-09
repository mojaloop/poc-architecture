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

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'
import base64url from 'base64url'
import { IDomainMessage } from '@mojaloop-poc/lib-domain'

export const extractTraceStateFromMessage = (message: IDomainMessage): any => {
  let theTraceState = null

  /* Get the trace state if present in the message */
  const traceState: string | undefined = message.traceInfo?.traceState
  if (traceState !== undefined) {
    /* expecting something like "acmevendor=eyJzcGF..." where "eyJzcGF" is base64 encoded msg */
    if (traceState.includes('=')) {
      const payloadEncoded = traceState.substr(traceState.indexOf('=') + 1)
      const payloadDecoded = base64url.toBuffer(payloadEncoded)
      try {
        theTraceState = JSON.parse(payloadDecoded.toString())
      } catch (err) {
        /* eslint-disable-next-line no-console */
        console.error('extractTraceStateFromMessage Error when JSON.parse()-ing message')
      }
    }
  }

  return theTraceState
}

export const injectTraceStateToMessage = (message: IDomainMessage, toInject: any): void => {
  const currentTraceState: string | undefined = message.traceInfo?.traceState

  if (currentTraceState !== undefined) {
    /* expecting something like "acmevendor=eyJzcGF..." where "eyJzcGF" is base64 encoded msg */
    if (currentTraceState.includes('=')) {
      const payloadEncoded = base64url.encode(JSON.stringify(toInject))
      message.traceInfo!.traceState = currentTraceState.substr(0, currentTraceState.indexOf('=')) + '=' + payloadEncoded
    }
  }
}

export const mergeObjectIntoTraceStateToMessage = (message: IDomainMessage, toInject: any): void => {
  const currentMsg = extractTraceStateFromMessage(message)
  const newMsg = {
    ...currentMsg,
    ...toInject
  }
  injectTraceStateToMessage(message, newMsg)
}
