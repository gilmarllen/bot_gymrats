import axios from 'axios'
import { ChallengeID, Challenge } from '../gymrat/types'
import mockChallenge from '../mock/challenges/752473.json'

export async function getChallenge(
  challengeID: ChallengeID,
): Promise<Challenge> {
  if (process.env.NODE_ENV === 'prod') {
    const response = await axios.get<Challenge>(
      `https://www.gymrats.app/api/challenges/${challengeID}/workouts?page=0`,
      {
        headers: {
          Authorization: process.env.AUTHORIZATION_TOKEN,
        },
      },
    )

    return response.data
  } else {
    return mockChallenge as Challenge
  }
}

export async function sendComment(
  workoutID: Challenge['data'][0]['id'],
  message: string,
) {
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
