export type ChallengeID = number
export type WorkoutID = number

export interface WithSuccess<T> {
  data: T
  success: string
}

export type ActivityType =
  | 'running'
  | 'walking'
  | 'swimming'
  | 'strength training'
  | undefined

export interface Workout {
  id: WorkoutID
  version: string
  description?: string | null
  title: string
  duration?: number | null
  points: any
  account: Account
  media: Media[]
  steps: any
  created_at: string
  distance: string | null
  calories: number | null
  duration_millis?: number | null
  gym_rats_user_id: number
  challenge_id: ChallengeID
  occurred_at: string
  workout_activities: Activity[] | null
  activity_metric_amount: any
  reactions: Reaction[]
  photo_url: string
  apple_workout_uuid: any
  activity_type: any
  activity_count: number
  apple_device_name: any
  apple_source_name: any
  google_place_id: any
  workout_entry_id: number
  activity: any
  formatted_details: FormattedDetails
}

export interface Account {
  id: number
  twitter: string | null
  instagram: string | null
  email: string
  full_name: string
  profile_picture_url?: string | null
  tik_tok: string | null
}

export interface Media {
  id: number
  width: number
  source: string
  url: string
  height: number
  medium_type: string
  thumbnail_url: string | null
  aspect_ratio: number
}

export interface Reaction {
  account: Account
  reaction: string
}

export interface FormattedDetails {
  duration?: string | null
  points: any
  steps: any
  distance: string | null
  calories: string | null
  duration_millis?: string | null
  activity_metric_amount: any
}

export interface ActivityCategory {
  id: number
  name: string
  key: string
  icon_url: string
}

export interface PlatformActivity {
  id: number
  name: string
  category: ActivityCategory
  key: string
  order: number
  icon_url: string
}

export interface IntegrationActivity {
  id: number
  name: string
  manual: boolean
  start_time: string
  steps: number | null
  calories: number | null
  distance_miles: any
  duration_millis: number | null
  integration_id: string
  integration_type: string
  platform_activity: PlatformActivity
}

export interface Activity {
  id: number
  start_time: string
  points: number | null
  steps: number | null
  distance: string | null
  calories: number | null
  duration_millis: number | null
  activity_metric_amount: number | null
  platform_activity: PlatformActivity | null
  activity_type: unknown | null
  integration_activity: IntegrationActivity | null
}
