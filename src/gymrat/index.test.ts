import axios from 'axios'
import {
  getChallengeWorkouts,
  getWorkout,
  sendComment,
  getActivityType,
} from '.'
import { Workout } from './types'
import mockWorkoutData from '../mock/workout.json'
import mockChallengeWorkoutsData from '../mock/challenges/workouts.json'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
  vi.clearAllMocks()
})

function makeWorkoutWithActivityId(id: number): Workout {
  return {
    ...mockWorkoutData.data,
    workout_activities: [
      {
        ...mockWorkoutData.data.workout_activities[0],
        platform_activity: {
          ...mockWorkoutData.data.workout_activities[0].platform_activity,
          id,
        },
      },
    ],
  } as unknown as Workout
}

describe('getActivityType', () => {
  it('returns running for activity ID 55', () => {
    expect(getActivityType(makeWorkoutWithActivityId(55))).toBe('running')
  })

  it('returns swimming for activity ID 46', () => {
    expect(getActivityType(makeWorkoutWithActivityId(46))).toBe('swimming')
  })

  it('returns strength training for activity ID 58', () => {
    expect(getActivityType(makeWorkoutWithActivityId(58))).toBe(
      'strength training',
    )
  })

  it('returns undefined for an unknown activity ID', () => {
    expect(getActivityType(makeWorkoutWithActivityId(99))).toBeUndefined()
  })

  it('returns undefined when workout_activities is null', () => {
    const workout = {
      ...mockWorkoutData.data,
      workout_activities: null,
    } as unknown as Workout
    expect(getActivityType(workout)).toBeUndefined()
  })

  it('returns undefined when workout_activities is empty', () => {
    const workout = {
      ...mockWorkoutData.data,
      workout_activities: [],
    } as unknown as Workout
    expect(getActivityType(workout)).toBeUndefined()
  })
})

describe('getChallengeWorkouts', () => {
  it('returns mock data in dev mode', async () => {
    process.env.NODE_ENV = 'dev'
    const result = await getChallengeWorkouts(333373)
    expect(result).toEqual(mockChallengeWorkoutsData.data)
  })

  it('calls the API with correct URL and headers in prod mode', async () => {
    process.env.NODE_ENV = 'prod'
    process.env.AUTHORIZATION_TOKEN = 'test-token'
    mockedAxios.get.mockResolvedValue({
      data: { data: mockChallengeWorkoutsData.data },
    })

    const result = await getChallengeWorkouts(333373)

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.gymrats.app/api/challenges/333373/workouts?page=0',
      { headers: { Authorization: 'test-token' } },
    )
    expect(result).toEqual(mockChallengeWorkoutsData.data)
  })
})

describe('getWorkout', () => {
  it('returns mock workout in dev mode', async () => {
    process.env.NODE_ENV = 'dev'
    const result = await getWorkout(133590219)
    expect(result).toEqual(mockWorkoutData.data)
  })

  it('calls the API with correct URL and headers in prod mode', async () => {
    process.env.NODE_ENV = 'prod'
    process.env.AUTHORIZATION_TOKEN = 'test-token'
    mockedAxios.get.mockResolvedValue({ data: { data: mockWorkoutData.data } })

    const result = await getWorkout(133590219)

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.gymrats.app/api/workouts/133590219',
      { headers: { Authorization: 'test-token' } },
    )
    expect(result).toEqual(mockWorkoutData.data)
  })
})

describe('sendComment', () => {
  it('logs the message in dev mode', async () => {
    process.env.NODE_ENV = 'dev'
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await sendComment(133590219, 'Great workout!')

    expect(consoleSpy).toHaveBeenCalledWith('Great workout!')
    consoleSpy.mockRestore()
  })

  it('calls the API with correct URL, body, and headers in prod mode', async () => {
    process.env.NODE_ENV = 'prod'
    process.env.AUTHORIZATION_TOKEN = 'test-token'
    mockedAxios.post.mockResolvedValue({})

    await sendComment(133590219, 'Great workout!')

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://www.gymrats.app/api/workouts/133590219/comments',
      { content: 'Great workout!' },
      { headers: { Authorization: 'test-token' } },
    )
  })

  it('catches and logs errors in prod mode', async () => {
    process.env.NODE_ENV = 'prod'
    mockedAxios.post.mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(sendComment(133590219, 'Hi')).resolves.not.toThrow()

    consoleSpy.mockRestore()
  })
})
