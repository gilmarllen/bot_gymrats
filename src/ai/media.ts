import https from 'https'
import fs from 'fs'
import path from 'path'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { Media } from '../gymrat/types'
import { delay } from '../utils'

interface DownloadResult {
  path: string
}

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_TOKEN ?? '')

function isImage({ medium_type }: Media) {
  return medium_type.startsWith('image')
}

function isVideo({ medium_type }: Media) {
  return medium_type.startsWith('video')
}

const deleteFile = fs.unlink

async function prepareImage({ url, medium_type }: Media) {
  const content = await fetch(url).then((response) => {
    if (response.status !== 200) {
      throw new Error(`Failed to get '${url}' (${response.status})`)
    }
    return response.arrayBuffer()
  })

  return {
    inlineData: {
      data: Buffer.from(content).toString('base64'),
      mimeType: medium_type,
    },
  }
}

async function wait4VideoUpload(name: string) {
  let file = await fileManager.getFile(name)
  while (file.state === FileState.PROCESSING) {
    // Sleep for 5 seconds
    await delay(5_000)
    // Fetch the file from the API again
    file = await fileManager.getFile(name)
  }

  if (file.state === FileState.FAILED) {
    throw new Error('Video processing failed.')
  }
}

async function prepareVideo({ url, medium_type }: Media) {
  const { path } = await downloadVideo(url)

  const uploadResponse = await fileManager.uploadFile(path, {
    mimeType: medium_type,
  })

  deleteFile(path, () => {})

  await wait4VideoUpload(uploadResponse.file.name)

  return {
    fileData: {
      mimeType: uploadResponse.file.mimeType,
      fileUri: uploadResponse.file.uri,
    },
  }
}

async function downloadVideo(url: string): Promise<DownloadResult> {
  const fileName = path.basename(new URL(url).pathname)
  const outputPath = path.join(__dirname, fileName)

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          response.resume()
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`))
          return
        }

        const fileStream = fs.createWriteStream(outputPath)
        response.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close(() => resolve({ path: outputPath }))
        })
      })
      .on('error', (err) => {
        deleteFile(outputPath, () => reject(err))
      })
  })
}

export async function prepareMediaPrompt(medias: Media[]) {
  const supportedMedias = medias.filter((m) => isImage(m) || isVideo(m))

  const medias4Prompt = await Promise.all(
    supportedMedias.map(async (m) => {
      try {
        if (isVideo(m)) return await prepareVideo(m)
        else return await prepareImage(m)
      } catch (error) {
        console.error('Error getting media', error)
        return null
      }
    }),
  )

  return medias4Prompt.filter((result) => result !== null)
}
