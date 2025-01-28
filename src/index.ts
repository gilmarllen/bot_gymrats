import 'dotenv/config'

import { formatPrompt, askAI } from './ai'
import { differenceInMilliseconds, addMinutes } from 'date-fns'
import { getChallenge, sendComment } from './gymrat/index'

const TIME_INTERVAL = process.env.TIME_INTERVAL
  ? parseInt(process.env.TIME_INTERVAL)
  : 0

// Main function to fetch and process data
async function main(challengeID: number) {
  console.log(`[${challengeID}] start`)

  try {
    const { data: posts } = await getChallenge(challengeID)

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

      const AIreply = await askAI(formatPrompt(post))
      if (AIreply && AIreply.length > 0) {
        sendComment(post.id, AIreply)
      }
    }
  } catch (error) {
    console.error(`[${challengeID}] An error occurred:`, error)
  }

  console.log(`[${challengeID}] end`)
}

const challengeIDs = process.env.CHALLENGES?.split(' ').map((str) =>
  parseInt(str),
)

challengeIDs?.forEach((id) => main(id))
