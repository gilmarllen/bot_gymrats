export type ChallengeID = number

export interface Challenge {
  data: PostData[]
  status: string
}

export interface PostData {
  id: number
  version: string
  description?: string | null
  title: string
  duration?: number
  points: any
  account: Account
  media: Media[]
  steps: any
  created_at: string
  distance: any
  calories: any
  duration_millis?: number
  gym_rats_user_id: number
  challenge_id: ChallengeID
  occurred_at: string
  workout_activities: any
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
  twitter: any
  instagram: any
  email: string
  full_name: string
  profile_picture_url?: string
  tik_tok: any
}

export interface Media {
  id: number
  width: number
  source: string
  url: string
  height: number
  medium_type: string
  thumbnail_url: string
  aspect_ratio: number
}

export interface Reaction {
  account: Account
  reaction: string
}

export interface FormattedDetails {
  duration?: string
  points: any
  steps: any
  distance: any
  calories: any
  duration_millis?: string
  activity_metric_amount: any
}
