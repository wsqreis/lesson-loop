export type TrialStatus = 'active' | 'converted' | 'expired'

export type ActivationEventType =
  | 'trial_started'
  | 'teacher_invited'
  | 'teacher_onboarded'
  | 'session_created'
  | 'answer_submitted'
  | 'subscription_started'

export interface FunnelSummary {
  trialsStarted: number
  teachersOnboarded: number
  sessionsCreated: number
  answersSubmitted: number
  subscriptionsStarted: number
  conversionRate: number
}

export interface AiRecommendation {
  title: string
  rationale: string
  action: string
}

export interface AnswerSubmissionPayload {
  sessionId: string
  activityId: string
  studentCode: string
  answer: string
  isCorrect: boolean
}

export interface BatchAnswerSubmissionPayload {
  answers: AnswerSubmissionPayload[]
}

export interface ActivationChecklistItem {
  key: string
  label: string
  completed: boolean
  helper: string
  action?: string
}

export interface ActivationChecklist {
  schoolId: string
  schoolName: string
  items: ActivationChecklistItem[]
  completionRate: number
  nextAction?: string
}
