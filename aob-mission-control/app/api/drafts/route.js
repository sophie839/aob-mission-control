import { getServerSession } from 'next-auth/next'
import { google } from 'googleapis'
import { authOptions } from '../../lib/auth'

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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }
    const gmail = getGmailClient(session.accessToken)
    const draftsRes = await gmail.users.drafts.list({ userId: 'me', maxResults: 100 })
    const drafts = draftsRes.data.drafts || []
    const draftDetails = []
    for (const draft of drafts) {
      const fullDraft = await gmail.users.drafts.get({ userId: 'me', id: draft.id, format: 'full' })
      const message = fullDraft.data.message
      const headers = message.payload.headers || []
      draftDetails.push({
        id: draft.id,
        messageId: message.id,
        to: getHeaderValue(headers, 'To'),
        subject: getHeaderValue(headers, 'Subject'),
        from: getHeaderValue(headers, 'From'),
        body: extractTextFromMessage(message),
        timestamp: message.internalDate,
      })
    }
    return new Response(JSON.stringify(draftDetails), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Drafts API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch drafts', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
