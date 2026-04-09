import { Media } from '../gymrat/types'

const mockUploadFile = jest.fn()
const mockGetFile = jest.fn()

jest.mock('@google/generative-ai/server', () => ({
  GoogleAIFileManager: jest.fn().mockImplementation(() => ({
    uploadFile: mockUploadFile,
    getFile: mockGetFile,
  })),
  FileState: {
    PROCESSING: 'PROCESSING',
    FAILED: 'FAILED',
    ACTIVE: 'ACTIVE',
  },
}))

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: jest.fn(),
  unlink: jest.fn(),
}))

import { fixMimeType, prepareMediaPrompt } from '../ai/media'

const imageMedia: Media = {
  id: 1,
  width: 1080,
  height: 1920,
  source: 'library',
  url: 'https://example.com/image.jpg',
  medium_type: 'image/jpeg',
  thumbnail_url: null,
  aspect_ratio: 0.5625,
}

const videoMedia: Media = {
  id: 2,
  width: 1080,
  height: 1920,
  source: 'library',
  url: 'https://example.com/video.mp4',
  medium_type: 'video/mp4',
  thumbnail_url: null,
  aspect_ratio: 0.5625,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('fixMimeType', () => {
  it('converts image/jpg to image/jpeg', () => {
    expect(fixMimeType('image/jpg')).toBe('image/jpeg')
  })

  it('leaves other mime types unchanged', () => {
    expect(fixMimeType('image/jpeg')).toBe('image/jpeg')
    expect(fixMimeType('image/png')).toBe('image/png')
    expect(fixMimeType('video/mp4')).toBe('video/mp4')
  })
})

describe('prepareMediaPrompt', () => {
  it('returns empty array when no media provided', async () => {
    const result = await prepareMediaPrompt([])
    expect(result).toEqual([])
  })

  it('processes an image and returns inline data', async () => {
    const imageBuffer = Buffer.from('fake image content')
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      arrayBuffer: jest.fn().mockResolvedValue(imageBuffer.buffer),
    })

    const result = await prepareMediaPrompt([imageMedia])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      inlineData: {
        mimeType: 'image/jpeg',
        data: expect.any(String),
      },
    })
    expect(global.fetch).toHaveBeenCalledWith(imageMedia.url)
  })

  it('fixes mime type for image/jpg when processing image', async () => {
    const jpgMedia: Media = { ...imageMedia, medium_type: 'image/jpg' }
    const imageBuffer = Buffer.from('fake image content')
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      arrayBuffer: jest.fn().mockResolvedValue(imageBuffer.buffer),
    })

    const result = await prepareMediaPrompt([jpgMedia])

    expect(result[0]).toMatchObject({
      inlineData: { mimeType: 'image/jpeg' },
    })
  })

  it('skips media when fetch fails and returns null-filtered result', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      arrayBuffer: jest.fn(),
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const result = await prepareMediaPrompt([imageMedia])

    expect(result).toHaveLength(0)
    consoleSpy.mockRestore()
  })

  it('filters out unsupported media types', async () => {
    const unknownMedia: Media = { ...imageMedia, medium_type: 'audio/mp3' }
    const result = await prepareMediaPrompt([unknownMedia])
    expect(result).toHaveLength(0)
  })

  it('processes a video and returns file data', async () => {
    const https = require('https')
    const fs = require('fs')
    const { EventEmitter } = require('events')

    const mockResponse = Object.assign(new EventEmitter(), {
      statusCode: 200,
      resume: jest.fn(),
      pipe: jest.fn(),
    })

    const mockFileStream = Object.assign(new EventEmitter(), {
      close: jest.fn((cb: () => void) => cb()),
    })

    jest.spyOn(https, 'get').mockImplementation((...args: unknown[]) => {
      const cb = args[1] as (res: unknown) => void
      cb(mockResponse)
      mockFileStream.emit('finish')
      return { on: jest.fn() }
    })

    fs.createWriteStream.mockReturnValue(mockFileStream)

    mockUploadFile.mockResolvedValue({
      file: { name: 'files/test123', mimeType: 'video/mp4', uri: 'https://ai.example.com/files/test123' },
    })

    mockGetFile.mockResolvedValue({
      state: 'ACTIVE',
      name: 'files/test123',
      mimeType: 'video/mp4',
      uri: 'https://ai.example.com/files/test123',
    })

    const result = await prepareMediaPrompt([videoMedia])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      fileData: {
        mimeType: 'video/mp4',
        fileUri: 'https://ai.example.com/files/test123',
      },
    })
  })
})
