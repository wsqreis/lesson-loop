import { describe, expect, it } from 'vitest'

import { ActivationService } from './activation.service.js'

function createService(overrides: Record<string, unknown>) {
  return new ActivationService(overrides as never)
}

describe('ActivationService analytics', () => {
  it('calculates funnel conversion rate from activation events', async () => {
    const service = createService({
      activationEvent: {
        groupBy: async () => [
          { type: 'trial_started', _count: 4 },
          { type: 'teacher_onboarded', _count: 3 },
          { type: 'session_created', _count: 2 },
          { type: 'answer_submitted', _count: 40 },
          { type: 'subscription_started', _count: 1 },
        ],
      },
    })

    await expect(service.funnelSummary()).resolves.toMatchObject({
      trialsStarted: 4,
      teachersOnboarded: 3,
      sessionsCreated: 2,
      answersSubmitted: 40,
      subscriptionsStarted: 1,
      conversionRate: 25,
    })
  })

  it('summarizes school expansion metrics', async () => {
    const service = createService({
      school: {
        findMany: async () => [
          {
            id: 'school-1',
            name: 'Northstar Primary',
            teachers: [
              { id: 'teacher-1', onboardedAt: new Date() },
              { id: 'teacher-2', onboardedAt: null },
            ],
            sessions: [
              { teacherId: 'teacher-1', answers: [{}, {}] },
              { teacherId: 'teacher-1', answers: [{}] },
            ],
            subscriptions: [{}],
          },
        ],
      },
    })

    await expect(service.schoolActivationMetrics()).resolves.toEqual([
      {
        schoolId: 'school-1',
        schoolName: 'Northstar Primary',
        teachersInvited: 2,
        teachersOnboarded: 1,
        activeTeachers: 1,
        sessionsCreated: 2,
        answersSubmitted: 3,
        hasSubscription: true,
      },
    ])
  })
})
