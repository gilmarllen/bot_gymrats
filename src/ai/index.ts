import { Workout } from '../gymrat/types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prepareMediaPrompt } from './media'
import { retry } from '../utils'
import { getActivityType } from '../gymrat'

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

function formatPrompt(post: Workout) {
  const distanceInKm = post.distance
    ? (Number(post.distance) * 1.609).toFixed(2)
    : null

  const fields: FieldInfo[] = [
    { name: 'Título', content: post.title },
    { name: 'Descrição', content: post.description },
    { name: 'Duração em minutos', content: post.formatted_details.duration },
    { name: 'Calorias ativas', content: post.formatted_details.calories },
    { name: 'Distância em Km', content: distanceInKm },
    { name: 'Usuário', content: post.account.full_name.split(' ')[0] },
  ]

  const activityType = getActivityType(post)

  if (activityType === 'running' || activityType === 'walking')
    fields.push({ name: 'Passos', content: post.formatted_details.steps })

  if (activityType === 'swimming')
    fields.push({ name: 'Atividade', content: activityType })

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
  model: 'gemini-2.0-flash-001',
  systemInstruction:
    'Você é um expert fitness de musculação e corrida, respondendo a posts em uma rede social de atividades físicas. Você usará um tom zoeiro e descontraído. Com base nos elementos do post e principalmente na imagem, provoque de maneira divertida e elogie o usuário, focando mais na zoação',
  generationConfig: { temperature: 1.99, topP: 0.99 },
})

export async function replyPost(post: Workout) {
  const MAX_RETRIES = 3
  const prompt = formatPrompt(post)

  const mediasPrompt = await prepareMediaPrompt(post.media)
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
