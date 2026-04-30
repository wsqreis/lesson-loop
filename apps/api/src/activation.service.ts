import { Injectable } from '@nestjs/common'
import { ActivationEventType } from '@prisma/client'
import { PrismaService } from './prisma.service.js'

@Injectable()
export class ActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async listSchools() {
    return this.prisma.school.findMany({
      include: {
        teachers: true,
        trials: true,
        subscriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async startTrial(data: { schoolName: string; country: string; teacherName: string; teacherEmail: string }) {
    return this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: data.schoolName,
          country: data.country,
          teachers: {
            create: {
              name: data.teacherName,
              email: data.teacherEmail,
              onboardedAt: new Date(),
            },
          },
          trials: {
            create: {
              endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          },
        },
        include: { teachers: true, trials: true },
      })

      await tx.activationEvent.createMany({
        data: [
          { schoolId: school.id, type: 'trial_started' },
          { schoolId: school.id, teacherId: school.teachers[0].id, type: 'teacher_onboarded' },
        ],
      })

      return school
    })
  }

  async inviteTeacher(schoolId: string, data: { name: string; email: string }) {
    const teacher = await this.prisma.teacher.create({ data: { ...data, schoolId } })
    await this.prisma.activationEvent.create({
      data: { schoolId, teacherId: teacher.id, type: 'teacher_invited' },
    })
    return teacher
  }

  async createSession(data: {
    schoolId: string
    teacherId: string
    title: string
    subject: string
    grade: string
    activities: Array<{ prompt: string; kind: string }>
  }) {
    const session = await this.prisma.classroomSession.create({
      data: {
        schoolId: data.schoolId,
        teacherId: data.teacherId,
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        activities: { create: data.activities },
      },
      include: { activities: true, teacher: true },
    })

    await this.prisma.activationEvent.create({
      data: { schoolId: data.schoolId, teacherId: data.teacherId, type: 'session_created' },
    })

    return session
  }

  async listSessions() {
    return this.prisma.classroomSession.findMany({
      include: { activities: true, answers: true, teacher: true, school: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async submitAnswer(data: {
    sessionId: string
    activityId: string
    studentCode: string
    answer: string
    isCorrect: boolean
  }) {
    const session = await this.prisma.classroomSession.findUniqueOrThrow({
      where: { id: data.sessionId },
    })
    const answer = await this.prisma.studentAnswer.create({ data })
    await this.prisma.activationEvent.create({
      data: {
        schoolId: session.schoolId,
        teacherId: session.teacherId,
        type: 'answer_submitted',
        metadata: JSON.stringify({ sessionId: data.sessionId, activityId: data.activityId }),
      },
    })
    return answer
  }

  async convertTrial(schoolId: string, data: { plan: 'starter' | 'school' | 'district'; seats: number }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.trial.updateMany({ where: { schoolId, status: 'active' }, data: { status: 'converted' } })
      const subscription = await tx.subscription.create({ data: { schoolId, ...data } })
      await tx.activationEvent.create({ data: { schoolId, type: 'subscription_started' } })
      return subscription
    })
  }

  async funnelSummary() {
    const events = await this.prisma.activationEvent.groupBy({ by: ['type'], _count: true })
    const count = (type: ActivationEventType) =>
      events.find((event) => event.type === type)?._count ?? 0
    const trialsStarted = count('trial_started')
    const subscriptionsStarted = count('subscription_started')

    return {
      trialsStarted,
      teachersOnboarded: count('teacher_onboarded'),
      sessionsCreated: count('session_created'),
      answersSubmitted: count('answer_submitted'),
      subscriptionsStarted,
      conversionRate: trialsStarted === 0 ? 0 : Math.round((subscriptionsStarted / trialsStarted) * 100),
    }
  }

  async recommendations() {
    const summary = await this.funnelSummary()
    const schools = await this.listSchools()
    const sessions = await this.listSessions()

    return [
      {
        title: 'Invite the second teacher earlier',
        rationale: `${summary.teachersOnboarded} onboarded teachers across ${schools.length} schools suggests activation depends on fast peer adoption.`,
        action: 'Trigger an invite prompt immediately after the first successful classroom session.',
      },
      {
        title: 'Use answer volume as a trial health signal',
        rationale: `${summary.answersSubmitted} answers have been submitted across ${sessions.length} sessions. This is a strong indicator of classroom value.`,
        action: 'Surface a conversion nudge when a school reaches 25 submitted answers during the trial.',
      },
      {
        title: 'Recommend a ready-to-run activity',
        rationale: 'Teachers move faster when the next lesson step is concrete and low effort.',
        action: 'Generate a subject-specific warm-up based on the teacher’s latest session.',
      },
    ]
  }
}
