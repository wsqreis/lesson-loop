import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ActivationService } from './activation.service.js'

@Controller()
export class ActivationController {
  constructor(private readonly activation: ActivationService) {}

  @Get('schools')
  listSchools() {
    return this.activation.listSchools()
  }

  @Post('trials')
  startTrial(
    @Body()
    body: { schoolName: string; country: string; teacherName: string; teacherEmail: string },
  ) {
    return this.activation.startTrial(body)
  }

  @Post('schools/:schoolId/teachers')
  inviteTeacher(@Param('schoolId') schoolId: string, @Body() body: { name: string; email: string }) {
    return this.activation.inviteTeacher(schoolId, body)
  }

  @Post('schools/:schoolId/subscriptions')
  convertTrial(
    @Param('schoolId') schoolId: string,
    @Body() body: { plan: 'starter' | 'school' | 'district'; seats: number },
  ) {
    return this.activation.convertTrial(schoolId, body)
  }

  @Get('sessions')
  listSessions() {
    return this.activation.listSessions()
  }

  @Get('sessions/join/:joinCode')
  findSessionByJoinCode(@Param('joinCode') joinCode: string) {
    return this.activation.findSessionByJoinCode(joinCode)
  }

  @Post('sessions')
  createSession(
    @Body()
    body: {
      schoolId: string
      teacherId: string
      title: string
      subject: string
      grade: string
      activities: Array<{ prompt: string; kind: string }>
    },
  ) {
    return this.activation.createSession(body)
  }

  @Post('answers')
  submitAnswer(
    @Body()
    body: {
      sessionId: string
      activityId: string
      studentCode: string
      answer: string
      isCorrect: boolean
    },
  ) {
    return this.activation.submitAnswer(body)
  }

  @Get('analytics/funnel')
  funnelSummary() {
    return this.activation.funnelSummary()
  }

  @Get('analytics/schools')
  schoolActivationMetrics() {
    return this.activation.schoolActivationMetrics()
  }

  @Get('experiments')
  experiments() {
    return this.activation.experiments()
  }

  @Get('ai/recommendations')
  recommendations() {
    return this.activation.recommendations()
  }
}
