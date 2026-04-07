import { getServerSession } from 'next-auth/next'
import { google } from 'googleapis'
import { authOptions } from '../../lib/auth'

export const runtime = 'nodejs'

const getGmailClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({
    access_token: accessToken,
  })
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

  return text.trim().substring(0, 200)
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
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const gmail = getGmailClient(session.accessToken)

    const query = 'is:unread in:inbox newer_than:7d'
    const messagesRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    })

    const messages = messagesRes.data.messages || []
    const inboxItems = []

    for (const msg of messages.slice(0, 8)) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })

      const message = fullMessage.data
      const headers = message.payload.headers || []

      inboxItems.push({
        id: msg.id,
        from: getHeaderValue(headers, 'From'),
        subject: getHeaderValue(headers, 'Subject'),
        preview: extractTextFromMessage(message),
        timestamp: message.internalDate,
      })
    }

    return new Response(JSON.stringify(inboxItems), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Inbox API error:', error)

    const defaultItems = [
      {
        id: '1',
        from: 'Daniel Zakri',
        subject: 'Healthcare strategy discussion',
        preview: 'REPLY NEEDED',
        timestamp: Date.now().toString(),
      },
      {
        id: '2',
        from: 'TikTok Ads',
        subject: 'Ad budget running out',
        preview: 'Your monthly budget is depleting fast',
        timestamp: Date.now().toString(),
      },
      {
        id: '3',
        from: 'Eve Albert',
        subject: 'Latest deck request',
        preview: 'Can you send over the latest presentation?',
        timestamp: Date.now().toString(),
      },
    ]

    return new Response(JSON.stringify(defaultItems), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
