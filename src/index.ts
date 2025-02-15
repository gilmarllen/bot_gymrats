import 'dotenv/config'

import { replyPost } from './ai'
import { differenceInMilliseconds, addMinutes } from 'date-fns'
import { getChallengeWorkouts, sendComment, getWorkout } from './gymrat'

const TIME_INTERVAL = process.env.TIME_INTERVAL
  ? parseInt(process.env.TIME_INTERVAL)
  : 0

// Main function to fetch and process data
async function main(challengeID: number) {
  console.log(`[${challengeID}] start`)

  try {
    const posts = await getChallengeWorkouts(challengeID)

    // Filter posts created in the last TIME_INTERVAL
    const newPosts = posts.filter(({ created_at }) => {
      return (
        differenceInMilliseconds(
          new Date(),
          addMinutes(new Date(created_at), TIME_INTERVAL),
        ) <= 0
      )
    })

    console.log(
      `[${challengeID}] Found ${newPosts.length} new posts to process.`,
    )

    // Process the new posts
    for (const post of newPosts) {
      console.log(`[${challengeID}] Processing post with ID: ${post.id}`)

      try {
        const fullInfoPost = await getWorkout(post.id)

        const AIreply = await replyPost(fullInfoPost)
        if (AIreply && AIreply.length > 0) {
          sendComment(post.id, AIreply)
        }
      } catch (error) {
        console.error(
          `[${challengeID}] An error occurred when replying:`,
          error,
        )
      }
    }
  } catch (error) {
    console.error(
      `[${challengeID}] An error occurred when processing post:`,
      error,
    )
  }

  console.log(`[${challengeID}] end`)
}

const challengeIDs = process.env.CHALLENGES?.split(' ').map((str) =>
  parseInt(str),
)

challengeIDs?.forEach((id) => main(id))
