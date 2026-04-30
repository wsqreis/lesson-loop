import { BadRequestException, Injectable } from '@nestjs/common'
import { ActivationEventType } from '@prisma/client'
import { PrismaService } from './prisma.service.js'

type AnswerSubmissionPayload = {
  sessionId: string
  activityId: string
  studentCode: string
  answer: string
  isCorrect: boolean
}

type BatchAnswerSubmissionPayload = {
  answers: AnswerSubmissionPayload[]
}

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
    const joinCode = await this.createJoinCode()
    const session = await this.prisma.classroomSession.create({
      data: {
        schoolId: data.schoolId,
        teacherId: data.teacherId,
        joinCode,
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

  async findSessionByJoinCode(joinCode: string) {
    return this.prisma.classroomSession.findUniqueOrThrow({
      where: { joinCode: joinCode.toUpperCase() },
      include: { activities: true, teacher: true, school: true },
    })
  }

  async submitAnswer(data: AnswerSubmissionPayload) {
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

  async submitAnswersBatch(payload: BatchAnswerSubmissionPayload) {
    const answers = payload.answers ?? []
    if (answers.length === 0) {
      throw new BadRequestException('At least one answer is required.')
    }
    if (answers.length > 500) {
      throw new BadRequestException('Batch size cannot exceed 500 answers.')
    }

    const sessions = await this.prisma.classroomSession.findMany({
      where: { id: { in: [...new Set(answers.map((answer) => answer.sessionId))] } },
      include: { activities: true },
    })
    const sessionById = new Map(sessions.map((session) => [session.id, session]))

    for (const answer of answers) {
      const session = sessionById.get(answer.sessionId)
      if (!session) {
        throw new BadRequestException(`Unknown session: ${answer.sessionId}`)
      }
      if (!session.activities.some((activity) => activity.id === answer.activityId)) {
        throw new BadRequestException(`Activity ${answer.activityId} does not belong to session ${answer.sessionId}.`)
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.studentAnswer.createMany({ data: answers })
      await tx.activationEvent.createMany({
        data: answers.map((answer) => {
          const session = sessionById.get(answer.sessionId)!
          return {
            schoolId: session.schoolId,
            teacherId: session.teacherId,
            type: 'answer_submitted',
            metadata: JSON.stringify({ sessionId: answer.sessionId, activityId: answer.activityId }),
          }
        }),
      })
    })

    return { accepted: answers.length }
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

  async schoolActivationMetrics() {
    const schools = await this.prisma.school.findMany({
      include: {
        teachers: true,
        sessions: { include: { answers: true } },
        subscriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return schools.map((school) => {
      const onboardedTeachers = school.teachers.filter((teacher) => teacher.onboardedAt !== null).length
      const answersSubmitted = school.sessions.reduce(
        (total, session) => total + session.answers.length,
        0,
      )

      return {
        schoolId: school.id,
        schoolName: school.name,
        teachersInvited: school.teachers.length,
        teachersOnboarded: onboardedTeachers,
        activeTeachers: new Set(school.sessions.map((session) => session.teacherId)).size,
        sessionsCreated: school.sessions.length,
        answersSubmitted,
        hasSubscription: school.subscriptions.length > 0,
      }
    })
  }

  async experiments() {
    return this.prisma.growthExperiment.findMany({
      include: { school: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async recommendations() {
    const summary = await this.funnelSummary()
    const schools = await this.listSchools()
    const sessions = await this.listSessions()
    const metrics = await this.schoolActivationMetrics()
    const bestSchool = [...metrics].sort((a, b) => b.answersSubmitted - a.answersSubmitted)[0]

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
      {
        title: 'Scale from the most active school first',
        rationale: bestSchool
          ? `${bestSchool.schoolName} has ${bestSchool.answersSubmitted} submitted answers and ${bestSchool.teachersOnboarded} onboarded teachers.`
          : 'No school has enough activity yet to identify an expansion account.',
        action: 'Use the highest-engagement school as the first expansion conversation before broad outreach.',
      },
    ]
  }

  private async createJoinCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const random = () =>
      Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const joinCode = random()
      const existing = await this.prisma.classroomSession.findUnique({ where: { joinCode } })
      if (!existing) return joinCode
    }

    return `S${Date.now().toString(36).toUpperCase().slice(-5)}`
  }
}
