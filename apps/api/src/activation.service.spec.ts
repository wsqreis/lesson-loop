import { BadRequestException } from '@nestjs/common'
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

describe('ActivationService session detail', () => {
  it('loads a board-ready session payload', async () => {
    const service = createService({
      classroomSession: {
        findUniqueOrThrow: async ({ where }: { where: { id: string } }) => ({
          id: where.id,
          joinCode: 'MATH-42',
          activities: [],
          answers: [],
          teacher: { name: 'Maya Chen' },
          school: { name: 'Northstar Primary' },
        }),
      },
    })

    await expect(service.sessionDetail('session-1')).resolves.toMatchObject({
      id: 'session-1',
      joinCode: 'MATH-42',
    })
  })
})

describe('ActivationService activation checklist', () => {
  it('calculates completion and next action', async () => {
    const service = createService({
      school: {
        findMany: async () => [
          {
            id: 'school-1',
            name: 'Northstar Primary',
            teachers: [{ onboardedAt: new Date() }],
            trials: [{}],
            subscriptions: [],
            sessions: [{ answers: [{}, {}] }],
          },
        ],
      },
    })

    await expect(service.activationChecklist()).resolves.toMatchObject([
      {
        schoolId: 'school-1',
        schoolName: 'Northstar Primary',
        completionRate: 67,
        nextAction: 'Invite teacher',
      },
    ])
  })
})

describe('ActivationService answer ingestion', () => {
  it('creates answers and activation events in a batch', async () => {
    const calls: Array<{ model: string; data: unknown[] }> = []
    const service = createService({
      classroomSession: {
        findMany: async () => [
          {
            id: 'session-1',
            schoolId: 'school-1',
            teacherId: 'teacher-1',
            activities: [{ id: 'activity-1' }],
          },
        ],
      },
      $transaction: async (callback: (tx: unknown) => Promise<void>) =>
        callback({
          studentAnswer: {
            createMany: async ({ data }: { data: unknown[] }) => calls.push({ model: 'answer', data }),
          },
          activationEvent: {
            createMany: async ({ data }: { data: unknown[] }) => calls.push({ model: 'event', data }),
          },
        }),
    })

    await expect(
      service.submitAnswersBatch({
        answers: [
          {
            sessionId: 'session-1',
            activityId: 'activity-1',
            studentCode: 'S-1',
            answer: '2/4',
            isCorrect: true,
          },
          {
            sessionId: 'session-1',
            activityId: 'activity-1',
            studentCode: 'S-2',
            answer: '3/4',
            isCorrect: false,
          },
        ],
      }),
    ).resolves.toEqual({ accepted: 2 })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toMatchObject({ model: 'answer' })
    expect(calls[0].data).toHaveLength(2)
    expect(calls[1]).toMatchObject({ model: 'event' })
    expect(calls[1].data).toHaveLength(2)
  })

  it('rejects empty batches', async () => {
    const service = createService({})

    await expect(service.submitAnswersBatch({ answers: [] })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects unknown sessions', async () => {
    const service = createService({
      classroomSession: {
        findMany: async () => [],
      },
    })

    await expect(
      service.submitAnswersBatch({
        answers: [
          {
            sessionId: 'missing-session',
            activityId: 'activity-1',
            studentCode: 'S-1',
            answer: '2/4',
            isCorrect: true,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
