import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../../lib/auth'

// GET - fetch draft details
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = params
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const draft = await gmail.users.drafts.get({
      userId: 'me',
      id: draftId,
      format: 'full',
    })

    return Response.json(draft.data)
  } catch (error) {
    console.error('Draft GET error:', error)
    return Response.json({ error: 'Failed to get draft' }, { status: 500 })
  }
}

// POST - send the draft
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = params
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const result = await gmail.users.drafts.send({
      userId: 'me',
      requestBody: { id: draftId },
    })

    return Response.json({
      success: true,
      messageId: result.data.id,
      threadId: result.data.threadId,
    })
  } catch (error) {
    console.error('Draft SEND error:', error)
    return Response.json({ error: 'Failed to send draft' }, { status: 500 })
  }
}
