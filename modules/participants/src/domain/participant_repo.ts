import { IEntityStateRepository } from '@mojaloop-poc/lib-domain'
import { ParticipantState } from './participant_entity'

export interface IParticipantRepo extends IEntityStateRepository<ParticipantState> {
  hasAccount: (participantId: string, currency: string) => Promise<boolean>
}
