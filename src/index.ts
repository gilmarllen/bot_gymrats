import 'dotenv/config'

import { formatPrompt, askAI } from './ai'
import { differenceInMilliseconds, addMinutes } from 'date-fns'
import { ChallengeID } from './gymrat/types'
import { getChallenge, sendComment } from './gymrat/index'

const CHALLENGE_ID: ChallengeID = 752473
const TIME_INTERVAL = 10 // every 10 min

// Main function to fetch and process data
async function main(challengeID: number) {
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

    console.log(`Found ${newPosts.length} new posts to process.`)

    // Process the new posts
    for (const post of newPosts) {
      console.log(`Processing post with ID: ${post.id}`)
      const AIreply = await askAI(formatPrompt(post))
      sendComment(post.id, AIreply ?? '')
    }
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

main(CHALLENGE_ID)
