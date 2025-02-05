import { PostData } from '../gymrat/types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prepareMediaPrompt } from './media'
import { retry } from '../utils'

interface FieldInfo {
  name: string
  content: string | number | undefined | null
}

function validFieldInfo({ content }: FieldInfo) {
  return content && content.toString().length > 0
}

function fieldInfoStringfy({ name, content }: FieldInfo): string {
  return `${name}: ${content}`
}

function formatPrompt(post: PostData) {
  const distanceInKm = post.distance ? (post.distance * 1.609).toFixed(2) : null

  const fields: FieldInfo[] = [
    { name: 'Título', content: post.title },
    { name: 'Descrição', content: post.description },
    { name: 'Duração em minutos', content: post.formatted_details.duration },
    { name: 'Calorias ativas', content: post.formatted_details.calories },
    { name: 'Passos', content: post.formatted_details.steps },
    { name: 'Distância em Km', content: distanceInKm },
    { name: 'Usuário', content: post.account.full_name.split(' ')[0] },
  ]

  return fields.filter(validFieldInfo).map(fieldInfoStringfy).join('\n')
}

function checkMultipleOptionsResponse(content: string) {
  return (
    content.includes('Opção 1') &&
    content.includes('Opção 2') &&
    content.includes('Opção 3')
  )
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_TOKEN ?? '')
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction:
    'Você é um usuário de uma rede social de atividades físicas. Responda os posts de forma zoeira. Use emojis.',
})

export async function replyPost(post: PostData) {
  const MAX_RETRIES = 3
  const prompt = formatPrompt(post)

  // Filter only images for now
  const medias = post.media.filter(({ medium_type }) =>
    medium_type.startsWith('image'),
  )

  const mediasPrompt = await prepareMediaPrompt(medias)
  const finalPrompt =
    mediasPrompt.length > 0 ? [...mediasPrompt, prompt] : prompt

  if (process.env.NODE_ENV === 'dev') console.log(finalPrompt)

  return retry(async () => {
    try {
      const result = await model.generateContent(finalPrompt)
      const AIResponse = result.response.text().trim()
      const hasMultipleOptions = checkMultipleOptionsResponse(AIResponse)

      if (hasMultipleOptions)
        throw new Error('AI response suggesting multiple options')

      return AIResponse
    } catch (error) {
      console.error(
        `[${post.challenge_id}] An error occurred when getting AI response:`,
        error,
      )
      throw error
    }
  }, MAX_RETRIES)
}
