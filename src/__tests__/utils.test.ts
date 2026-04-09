import { delay, retry } from '../utils'

describe('delay', () => {
  it('resolves after the specified time', async () => {
    vi.useFakeTimers()
    const promise = delay(1000)
    vi.advanceTimersByTime(1000)
    await promise
    vi.useRealTimers()
  })
})

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns result when fn succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await retry(fn, 3)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and succeeds on second try', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success')

    const promise = retry(fn, 3)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after maxTries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'))

    const promise = retry(fn, 3)
    // Attach rejection handler before running timers to avoid unhandled rejection warning
    const assertion = expect(promise).rejects.toThrow('Function failed after 3 attempts')
    await vi.runAllTimersAsync()
    await assertion

    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('succeeds after multiple failures', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success')

    const promise = retry(fn, 5)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
