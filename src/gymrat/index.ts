import axios from 'axios'
import { WithSuccess, ChallengeID, WorkoutID, Workout } from '../gymrat/types'
import mockChallengeWorkouts from '../mock/challenges/workouts.json'
import mockWorkout from '../mock/workout.json'

export async function getChallengeWorkouts(
  challengeID: ChallengeID,
): Promise<Workout[]> {
  if (process.env.NODE_ENV === 'prod') {
    const response = await axios.get<WithSuccess<Workout[]>>(
      `https://www.gymrats.app/api/challenges/${challengeID}/workouts?page=0`,
      {
        headers: {
          Authorization: process.env.AUTHORIZATION_TOKEN,
        },
      },
    )

    return response.data.data
  } else {
    return mockChallengeWorkouts.data as Workout[]
  }
}

export async function getWorkout(workoutID: WorkoutID): Promise<Workout> {
  if (process.env.NODE_ENV === 'prod') {
    const response = await axios.get<WithSuccess<Workout>>(
      `https://www.gymrats.app/api/workouts/${workoutID}`,
      {
        headers: {
          Authorization: process.env.AUTHORIZATION_TOKEN,
        },
      },
    )

    return response.data.data
  } else {
    return mockWorkout.data as Workout
  }
}

export async function sendComment(workoutID: WorkoutID, message: string) {
  try {
    if (process.env.NODE_ENV === 'prod') {
      await axios.post(
        `https://www.gymrats.app/api/workouts/${workoutID}/comments`,
        { content: message },
        {
          headers: {
            Authorization: process.env.AUTHORIZATION_TOKEN,
          },
        },
      )
    } else {
      console.log(message)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}
