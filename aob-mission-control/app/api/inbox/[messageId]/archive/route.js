import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../../../lib/auth'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = params

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Remove INBOX label and add ARCHIVED
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['INBOX', 'UNREAD'],
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Archive error:', error)
    return Response.json({ error: 'Failed to archive' }, { status: 500 })
  }
}
