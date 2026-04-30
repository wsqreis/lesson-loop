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
