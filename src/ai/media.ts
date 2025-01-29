import { Media } from '../gymrat/types'

export function prepareMediaPrompt(medias: Media[]) {
  return Promise.all(
    medias.map(async ({ url, medium_type }) => {
      const content = await fetch(url).then((response) =>
        response.arrayBuffer(),
      )

      return {
        inlineData: {
          data: Buffer.from(content).toString('base64'),
          mimeType: medium_type,
        },
      }
    }),
  )
}
