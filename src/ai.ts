import { PostData } from './gymrat/types'
import { GoogleGenerativeAI } from '@google/generative-ai'

function fieldInfo(
  field: string,
  content: string | number | undefined | null,
): string {
  if (content && content.toString().length > 0) {
    return `${field}: ${content}`
  }

  return ''
}

export function formatPrompt(post: PostData) {
  return `
    Crie uma resposta zoeira para o post/log de atividade física com as seguintes informações:
    ${fieldInfo('Título', post.title)}
    ${fieldInfo('Descrição', post.description)}
    ${fieldInfo('Duração em minutos', post.duration)}
    ${fieldInfo('Usuário', post.account.full_name.split(' ')[0])}
    ${fieldInfo('Mídia(s)', post.media.map(({ url }) => url).join(', '))}

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
