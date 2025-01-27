import fs from 'fs'
import { ChallengeID, PostData } from './gymrat/types'

interface DB {
  lastPostProcessedByChallenge: Record<ChallengeID, PostData['id']>
}

const LAST_ID_FILE = 'last_id.json'

export function readDB(): DB {
  if (fs.existsSync(LAST_ID_FILE)) {
    const fileContent = fs.readFileSync(LAST_ID_FILE, 'utf-8')
    return JSON.parse(fileContent)
  } else {
    const initialContentDB: DB = { lastPostProcessedByChallenge: {} }
    fs.writeFileSync(LAST_ID_FILE, JSON.stringify(initialContentDB, null, 2))
    return initialContentDB
  }
}

export function writeDB(content: DB): void {
  fs.writeFileSync(LAST_ID_FILE, JSON.stringify(content, null, 2))
}
