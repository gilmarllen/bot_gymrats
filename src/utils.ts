export async function retry<T>(
  fn: () => Promise<T>,
  maxTries: number,
): Promise<T> {
  let attempts = 0
  while (attempts < maxTries) {
    try {
      return await fn()
    } catch (error) {
      attempts++
      if (attempts >= maxTries) {
        throw new Error(`Function failed after ${maxTries} attempts`)
      }
    }
  }
  throw new Error('Unexpected error in retry function')
}
