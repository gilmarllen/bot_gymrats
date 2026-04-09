import { Workout } from '../gymrat/types'

const mockGenerateContent = jest.fn()

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}))

jest.mock('../ai/media', () => ({
  prepareMediaPrompt: jest.fn().mockResolvedValue([]),
}))

jest.mock('../gymrat', () => ({
  getActivityType: jest.fn(),
}))

import { formatPrompt, replyPost } from '../ai'
import { getActivityType } from '../gymrat'

const mockedGetActivityType = getActivityType as jest.MockedFunction<typeof getActivityType>

const baseWorkout: Workout = {
  id: 1,
  version: 'v2',
  title: 'Morning Workout',
  description: 'Great session today',
  duration: 60,
  points: null,
  account: {
    id: 1,
    email: '',
    full_name: 'John Doe',
    twitter: null,
    instagram: null,
    tik_tok: null,
  },
  media: [],
  steps: null,
  created_at: '2025-01-01T00:00:00Z',
  distance: null,
  calories: 300,
  duration_millis: 3600000,
  gym_rats_user_id: 1,
  challenge_id: 1,
  occurred_at: '2025-01-01T00:00:00Z',
  workout_activities: null,
  activity_metric_amount: null,
  reactions: [],
  photo_url: '',
  apple_workout_uuid: null,
  activity_type: null,
  activity_count: 1,
  apple_device_name: null,
  apple_source_name: null,
  google_place_id: null,
  workout_entry_id: 1,
  activity: null,
  formatted_details: {
    duration: '60',
    points: null,
    steps: '5000',
    distance: null,
    calories: '300',
    duration_millis: '3,600,000',
    activity_metric_amount: null,
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedGetActivityType.mockReturnValue(undefined)
})

describe('formatPrompt', () => {
  it('includes title, description, duration, calories, and username', () => {
    const prompt = formatPrompt(baseWorkout)
    expect(prompt).toContain('Título: Morning Workout')
    expect(prompt).toContain('Descrição: Great session today')
    expect(prompt).toContain('Duração em minutos: 60')
    expect(prompt).toContain('Calorias ativas: 300')
    expect(prompt).toContain('Usuário: John')
  })

  it('uses only first name from full_name', () => {
    const prompt = formatPrompt(baseWorkout)
    expect(prompt).toContain('Usuário: John')
    expect(prompt).not.toContain('Doe')
  })

  it('omits null fields from output', () => {
    const workout = { ...baseWorkout, description: null, distance: null }
    const prompt = formatPrompt(workout)
    expect(prompt).not.toContain('Descrição')
    expect(prompt).not.toContain('Distância em Km')
  })

  it('converts distance from miles to km', () => {
    const workout = { ...baseWorkout, distance: '5' }
    const prompt = formatPrompt(workout)
    // 5 miles * 1.609 = 8.045 → "8.04"
    expect(prompt).toContain('Distância em Km: 8.04')
  })

  it('includes steps for running activity', () => {
    mockedGetActivityType.mockReturnValue('running')
    const prompt = formatPrompt(baseWorkout)
    expect(prompt).toContain('Passos: 5000')
  })

  it('includes steps for walking activity', () => {
    mockedGetActivityType.mockReturnValue('walking')
    const prompt = formatPrompt(baseWorkout)
    expect(prompt).toContain('Passos: 5000')
  })

  it('does not include steps for strength training', () => {
    mockedGetActivityType.mockReturnValue('strength training')
    const prompt = formatPrompt(baseWorkout)
    expect(prompt).not.toContain('Passos')
  })

  it('includes swimming activity label for swimming workouts', () => {
    mockedGetActivityType.mockReturnValue('swimming')
    const prompt = formatPrompt(baseWorkout)
    expect(prompt).toContain('Atividade: swimming')
  })
})

describe('replyPost', () => {
  it('returns the AI-generated response', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '  Nice workout!  ' },
    })

    const result = await replyPost(baseWorkout)
    expect(result).toBe('Nice workout!')
  })

  it('retries when AI returns multiple options response', async () => {
    jest.useFakeTimers()

    mockGenerateContent
      .mockResolvedValueOnce({
        response: { text: () => 'Opção 1: ... Opção 2: ... Opção 3: ...' },
      })
      .mockResolvedValue({
        response: { text: () => 'Great job!' },
      })

    const promise = replyPost(baseWorkout)
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('Great job!')
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)

    jest.useRealTimers()
  })

  it('throws after max retries when AI always fails', async () => {
    jest.useFakeTimers()

    mockGenerateContent.mockRejectedValue(new Error('API error'))
    jest.spyOn(console, 'error').mockImplementation()

    const promise = replyPost(baseWorkout)
    // Attach rejection handler before running timers to avoid unhandled rejection warning
    const assertion = expect(promise).rejects.toThrow('Function failed after 3 attempts')
    await jest.runAllTimersAsync()
    await assertion

    jest.useRealTimers()
  })
})
