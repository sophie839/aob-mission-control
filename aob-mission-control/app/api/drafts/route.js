import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../lib/auth'
import { getHeaderValue, extractMessageBody, truncate } from '../../lib/gmailHelpers'
import { extractEmail } from '../../lib/emailFilters'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const list = await gmail.users.drafts.list({
      userId: 'me',
      maxResults: 100,
    })

    const drafts = list.data.drafts || []
    const items = []

    // Fetch draft details in parallel (batch of 30)
    const batch = drafts.slice(0, 50)
    const details = await Promise.all(
      batch.map((d) =>
        gmail.users.drafts
          .get({ userId: 'me', id: d.id, format: 'full' })
          .catch(() => null)
      )
    )

    for (const detail of details) {
      if (!detail?.data?.message) continue
      const msg = detail.data.message
      const headers = msg.payload?.headers || []

      const to = getHeaderValue(headers, 'To')
      const subject = getHeaderValue(headers, 'Subject')
      const body = extractMessageBody(msg.payload)
      const threadId = msg.threadId

      items.push({
        id: detail.data.id,
        messageId: msg.id,
        threadId,
        to,
        toEmail: extractEmail(to),
        subject: subject || '(no subject)',
        preview: truncate(body, 200),
        body: truncate(body, 1000),
      })
    }

    return Response.json(items)
  } catch (error) {
    console.error('Drafts API error:', error)
    return Response.json([])
  }
}
