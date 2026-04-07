import { getServerSession } from 'next-auth/next'
import { google } from 'googleapis'
import { authOptions } from '../../../lib/auth'

export const runtime = 'nodejs'

const getGmailClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

const extractTextFromMessage = (message) => {
  if (!message.payload) return ''
  let text = ''
  const parts = message.payload.parts || []
  if (message.payload.body?.data) {
    text = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
  }
  for (const part of parts) {
    if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
      if (part.body?.data) {
        text += Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
    }
  }
  return text.trim()
}

const getHeaderValue = (headers, name) => {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
  return header?.value || ''
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }
    const gmail = getGmailClient(session.accessToken)
    const draftId = params.draftId
    const fullDraft = await gmail.users.drafts.get({ userId: 'me', id: draftId, format: 'full' })
    const message = fullDraft.data.message
    const headers = message.payload.headers || []
    const draftDetail = {
      id: draftId,
      messageId: message.id,
      to: getHeaderValue(headers, 'To'),
      subject: getHeaderValue(headers, 'Subject'),
      from: getHeaderValue(headers, 'From'),
      body: extractTextFromMessage(message),
      timestamp: message.internalDate,
    }
    return new Response(JSON.stringify(draftDetail), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Draft GET error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch draft', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }
    const gmail = getGmailClient(session.accessToken)
    const draftId = params.draftId
    const result = await gmail.users.drafts.send({
      userId: 'me',
      requestBody: { id: draftId },
    })
    return new Response(
      JSON.stringify({ success: true, messageId: result.data.id, threadId: result.data.threadId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Draft send error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send draft', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
