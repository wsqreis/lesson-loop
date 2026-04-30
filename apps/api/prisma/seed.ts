import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.activationEvent.deleteMany()
  await prisma.studentAnswer.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.classroomSession.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.trial.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.school.deleteMany()

  const school = await prisma.school.create({
    data: {
      name: 'Northstar Primary',
      country: 'United States',
      trials: {
        create: {
          status: 'active',
          endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
      teachers: {
        create: [
          {
            email: 'maya@northstar.example',
            name: 'Maya Chen',
            onboardedAt: new Date(),
          },
          {
            email: 'leo@northstar.example',
            name: 'Leo Martin',
          },
        ],
      },
    },
    include: { teachers: true },
  })

  const teacher = school.teachers[0]
  const session = await prisma.classroomSession.create({
    data: {
      schoolId: school.id,
      teacherId: teacher.id,
      title: 'Fractions Warm-up',
      subject: 'Math',
      grade: 'Grade 4',
      activities: {
        create: [
          {
            prompt: 'Which fraction is equivalent to 1/2?',
            kind: 'multiple_choice',
          },
          {
            prompt: 'Explain how you know two fractions are equivalent.',
            kind: 'open_response',
          },
        ],
      },
    },
    include: { activities: true },
  })

  await prisma.studentAnswer.createMany({
    data: [
      {
        sessionId: session.id,
        activityId: session.activities[0].id,
        studentCode: 'S-1001',
        answer: '2/4',
        isCorrect: true,
      },
      {
        sessionId: session.id,
        activityId: session.activities[0].id,
        studentCode: 'S-1002',
        answer: '3/4',
        isCorrect: false,
      },
      {
        sessionId: session.id,
        activityId: session.activities[1].id,
        studentCode: 'S-1003',
        answer: 'They cover the same amount of the whole.',
        isCorrect: true,
      },
    ],
  })

  await prisma.activationEvent.createMany({
    data: [
      { schoolId: school.id, type: 'trial_started' },
      { schoolId: school.id, teacherId: teacher.id, type: 'teacher_onboarded' },
      { schoolId: school.id, teacherId: teacher.id, type: 'session_created' },
      { schoolId: school.id, teacherId: teacher.id, type: 'answer_submitted' },
      { schoolId: school.id, teacherId: school.teachers[1].id, type: 'teacher_invited' },
    ],
  })
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
