/**
 * Created by Miguel de Barros
 */

'use strict'

import { getEnvIntegerOrDefault, getEnvValueOrDefault } from '@mojaloop-poc/lib-utilities'

// export const FspIds = ['fsp-1-f4e39533e60df24b', 'fsp-2-497b9b6aab9539d8', 'fsp-3-4c43bd56315c6db3', 'fsp-4-61ca515ef177a185']
// export const SimFspIds = ['simfsp01-f4e39533e60df24b', 'simfsp02-497b9b6aab9539d8', 'simfsp03-4c43bd56315c6db3', 'simfsp04-61ca515ef177a185', 'simfsp05-cc697fa4ce0c3156', 'simfsp06-8bb93c246e0a4fca', 'simfsp07-37e68151ab21f7f2', 'simfsp08-08cc4beaeea373e7']

const SIMULATED_DFSPS_CNT: number = getEnvIntegerOrDefault('SIMULATED_DFSPS_CNT', 8)
const PARTICIPANTS_COLLECTION: string = getEnvValueOrDefault('PARTICIPANTS_COLLECTION', 'perf1')

export const FspIds: string[] = ['fsp-1', 'fsp-2', 'fsp-3', 'fsp-4']
export const SimFspIds: string[] = []
for (let dfspIdx = 1; dfspIdx <= SIMULATED_DFSPS_CNT; dfspIdx++) {
  const newFsp = 'simfsp' + (dfspIdx.toString().padStart(2, '0'))
  SimFspIds.push(newFsp)
}

type tParticipantsCollectionsMappings = {
  [key: string]: string[]
}

export const participantsCollectionsMapping: tParticipantsCollectionsMappings = {
  local: FspIds,
  perf1: SimFspIds
}

export const getFspList = (): string[] => {
  let rv: string[] = []

  if (participantsCollectionsMapping[PARTICIPANTS_COLLECTION] !== undefined) {
    rv = participantsCollectionsMapping[PARTICIPANTS_COLLECTION]
  }

  return rv
}

export const getRandomFsps = (): string[] => {
  const fspIds = getFspList()
  const randomPayer = Math.floor(Math.random() * Math.floor(fspIds.length))

  const filterdFspIds = fspIds.filter(elem => elem !== fspIds[randomPayer])

  const randomPayee = Math.floor(Math.random() * Math.floor(filterdFspIds.length))
  // const payer: string = fspIds[random]
  // const payee: string = random + 1 >= fspIds.length ? fspIds[0] : fspIds[random + 1]
  const payer: string = fspIds[randomPayer]
  const payee: string = filterdFspIds[randomPayee]
  // const payer: string = SimFspIds[2]
  // const payee: string = SimFspIds[6]
  return [payer, payee]
}
