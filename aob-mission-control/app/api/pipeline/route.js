import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../lib/auth'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID
const RANGE = 'Sheet1!A1:Q1000'

// Column positions (0-indexed)
const COL = {
  company: 0,
  vertical: 1,
  contact: 2,
  title: 3,
  email: 4,
  phone: 5,
  distributor: 6,
  broker: 7,
  stage: 8,
  sampleSent: 9,
  sampleFollowUp: 10,
  lastContact: 11,
  firstOrder: 12,
  lastOrder: 13,
  volume: 14,
  revenue: 15,
  notes: 16,
}

// Map sheet stages to the 4 columns
const COLUMN_MAP = {
  PROSPECTING: ['1-New Prospect', '2-Outreach Sent'],
  DEVELOPING: ['3-Engaged', '4-Sample Sent', '5-Decision Pending'],
  CLOSED: ['6-Won'],
}

// Sub-stage display names for badges
const STAGE_LABELS = {
  '1-New Prospect': 'New',
  '2-Outreach Sent': 'Outreach Sent',
  '3-Engaged': 'Engaged',
  '4-Sample Sent': 'Sample Sent',
  '5-Decision Pending': 'Decision',
  '6-Won': 'Won',
}

function getColumn(stageValue) {
  for (const [col, stages] of Object.entries(COLUMN_MAP)) {
    if (stages.includes(stageValue)) return col
  }
  return null // Lost or unknown
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    })

    const rows = response.data.values || []
    if (rows.length < 2) {
      return Response.json({
        PROSPECTING: [],
        DEVELOPING: [],
        CLOSED: [],
      })
    }

    // Skip header row
    const dataRows = rows.slice(1)
    const columns = { PROSPECTING: [], DEVELOPING: [], CLOSED: [] }

    dataRows.forEach((row, index) => {
      const stage = (row[COL.stage] || '').trim()
      const column = getColumn(stage)
      if (!column) return // Skip Lost or unknown stages

      const company = (row[COL.company] || '').trim()
      if (!company) return // Skip empty rows

      columns[column].push({
        id: String(index + 2), // Sheet row number (1-indexed + header)
        company,
        vertical: (row[COL.vertical] || '').trim(),
        contact: (row[COL.contact] || '').trim(),
        title: (row[COL.title] || '').trim(),
        email: (row[COL.email] || '').trim(),
        phone: (row[COL.phone] || '').trim(),
        distributor: (row[COL.distributor] || '').trim(),
        broker: (row[COL.broker] || '').trim(),
        stage: stage,
        stageLabel: STAGE_LABELS[stage] || stage,
        lastContact: (row[COL.lastContact] || '').trim(),
        volume: (row[COL.volume] || '').trim(),
        revenue: (row[COL.revenue] || '').trim(),
        notes: (row[COL.notes] || '').trim(),
        hasDraft: false,
        draftId: null,
      })
    })

    return Response.json(columns)
  } catch (error) {
    console.error('Pipeline API error:', error)
    return Response.json({
      PROSPECTING: [],
      DEVELOPING: [],
      CLOSED: [],
    })
  }
}
