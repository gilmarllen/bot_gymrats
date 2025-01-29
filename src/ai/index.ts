import { PostData } from '../gymrat/types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { prepareMediaPrompt } from './media'

function fieldInfo(
  field: string,
  content: string | number | undefined | null,
): string {
  if (content && content.toString().length > 0) {
    return `${field}: ${content}`
  }

  return ''
}

function formatPrompt(post: PostData) {
  const distanceInKm = post.distance ? (post.distance * 1.609).toFixed(2) : null

  return `
    ${fieldInfo('Título', post.title)}
    ${fieldInfo('Descrição', post.description)}
    ${fieldInfo('Duração em minutos', post.formatted_details.duration)}
    ${fieldInfo('Calorias', post.formatted_details.calories)}
    ${fieldInfo('Passos', post.formatted_details.steps)}
    ${fieldInfo('Distância em Km', distanceInKm)}
    ${fieldInfo('Usuário', post.account.full_name.split(' ')[0])}
  `
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_TOKEN ?? '')
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction:
    'Você é um usuário de uma rede social de atividades físicas. Responda os posts de forma zoeira. Use emojis.',
})

export async function replyPost(post: PostData) {
  const prompt = formatPrompt(post)

  // Filter only images for now
  const medias = post.media.filter(({ medium_type }) =>
    medium_type.startsWith('image'),
  )

  try {
    const mediasPrompt = await prepareMediaPrompt(medias)

    const finalPrompt =
      mediasPrompt.length > 0 ? [...mediasPrompt, prompt] : prompt

    const result = await model.generateContent(finalPrompt)
    return result.response.text()
  } catch (error) {
    console.error('An error occurred:', error)
  }
}
