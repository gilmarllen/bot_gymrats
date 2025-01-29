import { PostData } from './gymrat/types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'

function fieldInfo(
  field: string,
  content: string | number | undefined | null,
): string {
  if (content && content.toString().length > 0) {
    return `${field}: ${content}`
  }

  return ''
}

function formatDate(dateString: string) {
  const date = parseISO(dateString)
  return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: pt })
}

export function formatPrompt(post: PostData) {
  return `
    Crie uma resposta zoeira para o post/log de atividade física com as seguintes informações:
    ${fieldInfo('Título', post.title)}
    ${fieldInfo('Descrição', post.description)}
    ${fieldInfo('Duração em minutos', post.formatted_details.duration)}
    ${fieldInfo('Calorias', post.formatted_details.calories)}
    ${fieldInfo('Passos', post.formatted_details.steps)}
    ${fieldInfo('Distância', post.formatted_details.distance)}
    ${fieldInfo('Usuário', post.account.full_name.split(' ')[0])}
    ${fieldInfo('Mídia(s)', post.media.map(({ url }) => url).join(', '))}
    ${fieldInfo('Ocorrido em', formatDate(post.occurred_at))}

    A resposta deve ser única e será diretamente redirecionada como comentário no post.
  `
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_TOKEN ?? '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function askAI(prompt: string) {
  try {
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('An error occurred:', error)
  }
}
