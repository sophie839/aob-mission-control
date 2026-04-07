import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../lib/auth'
import {
  isImportantEmail,
  calculateUrgency,
  extractSenderName,
  extractEmail,
} from '../../lib/emailFilters'
import { getHeaderValue, truncate } from '../../lib/gmailHelpers'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Fetch recent unread + important emails
    const list = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'in:inbox newer_than:7d -category:promotions -category:social -category:updates',
    })

    const messages = list.data.messages || []
    const items = []

    // Fetch message details in parallel (batch of 20 max)
    const batch = messages.slice(0, 30)
    const details = await Promise.all(
      batch.map((m) =>
        gmail.users.messages
          .get({
            userId: 'me',
            id: m.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          })
          .catch(() => null)
      )
    )

    for (const detail of details) {
      if (!detail?.data) continue
      const msg = detail.data
      const from = getHeaderValue(msg.payload?.headers, 'From')
      const subject = getHeaderValue(msg.payload?.headers, 'Subject')
      const date = getHeaderValue(msg.payload?.headers, 'Date')

      if (!isImportantEmail(from, subject)) continue

      const isUnread = (msg.labelIds || []).includes('UNREAD')

      items.push({
        id: msg.id,
        threadId: msg.threadId,
        from: extractSenderName(from),
        fromEmail: extractEmail(from),
        fromFull: from,
        subject: subject || '(no subject)',
        preview: truncate(msg.snippet, 140),
        date: date,
        urgency: calculateUrgency(from, subject, date),
        isUnread,
        hasDraft: false,
        draftId: null,
        draftSubject: null,
        draftPreview: null,
      })
    }

    // Sort: unread first, then by urgency, then by date
    const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    items.sort((a, b) => {
      if (a.isUnread !== b.isUnread) return a.isUnread ? -1 : 1
      if (a.urgency !== b.urgency)
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      return new Date(b.date) - new Date(a.date)
    })

    return Response.json(items.slice(0, 20))
  } catch (error) {
    console.error('Inbox API error:', error)
    return Response.json({ error: 'Failed to fetch inbox' }, { status: 500 })
  }
}
