import { EventEmitter } from 'events'
import { Media } from '../../gymrat/types'

const mockUploadFile = vi.hoisted(() => vi.fn())
const mockGetFile = vi.hoisted(() => vi.fn())

vi.mock('@google/generative-ai/server', () => ({
  GoogleAIFileManager: vi.fn().mockImplementation(() => ({
    uploadFile: mockUploadFile,
    getFile: mockGetFile,
  })),
  FileState: {
    PROCESSING: 'PROCESSING',
    FAILED: 'FAILED',
    ACTIVE: 'ACTIVE',
  },
}))

import { fixMimeType, prepareMediaPrompt, _http, _fs } from './media'

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
  vi.clearAllMocks()
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
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      arrayBuffer: vi.fn().mockResolvedValue(imageBuffer.buffer),
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
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      arrayBuffer: vi.fn().mockResolvedValue(imageBuffer.buffer),
    })

    const result = await prepareMediaPrompt([jpgMedia])

    expect(result[0]).toMatchObject({
      inlineData: { mimeType: 'image/jpeg' },
    })
  })

  it('skips media when fetch fails and returns null-filtered result', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      arrayBuffer: vi.fn(),
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

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
    const mockHttpsGet = vi.fn()
    const mockCreateWriteStream = vi.fn()
    const mockUnlink = vi.fn()

    // Inject mocks directly on the exported dependency objects
    const originalGet = _http.get
    const originalCreateWriteStream = _fs.createWriteStream
    const originalUnlink = _fs.unlink

    _http.get = mockHttpsGet as typeof _http.get
    _fs.createWriteStream =
      mockCreateWriteStream as typeof _fs.createWriteStream
    _fs.unlink = mockUnlink as typeof _fs.unlink

    const mockResponse = Object.assign(new EventEmitter(), {
      statusCode: 200,
      resume: vi.fn(),
      pipe: vi.fn(),
    })

    const mockFileStream = Object.assign(new EventEmitter(), {
      close: vi.fn((cb: () => void) => cb()),
    })

    mockHttpsGet.mockImplementation((...args: unknown[]) => {
      const cb = args[1] as (res: unknown) => void
      cb(mockResponse)
      mockFileStream.emit('finish')
      return { on: vi.fn() }
    })

    mockCreateWriteStream.mockReturnValue(mockFileStream)

    mockUploadFile.mockResolvedValue({
      file: {
        name: 'files/test123',
        mimeType: 'video/mp4',
        uri: 'https://ai.example.com/files/test123',
      },
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

    // Restore originals
    _http.get = originalGet
    _fs.createWriteStream = originalCreateWriteStream
    _fs.unlink = originalUnlink
  })
})
