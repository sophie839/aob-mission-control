import { getServerSession } from 'next-auth/next'
import { google } from 'googleapis'
import { authOptions } from '../../lib/auth'

export const runtime = 'nodejs'

const getSheetsClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({
    access_token: accessToken,
  })
  return google.sheets({ version: 'v4', auth: oauth2Client })
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID
const RANGE = 'Sheet1!A1:Q1000'

const stages = [
  { name: '1-New Prospect', displayName: 'Cold Prospect', id: 'cold', color: '--stage-cold' },
  { name: '2-Outreach Sent', displayName: 'Outreach Sent', id: 'followup', color: '--stage-sent' },
  { name: '3-Engaged', displayName: 'Engaged', id: 'engaged', color: '--stage-engaged' },
  { name: '4-Sample Sent', displayName: 'Sample Sent', id: 'sample', color: '--stage-sample' },
  { name: '5-Decision Pending', displayName: 'Decision Pending', id: 'decision', color: '--stage-decision' },
  { name: '6-Won', displayName: 'Won', id: 'won', color: '--stage-won' },
]

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const sheets = getSheetsClient(session.accessToken)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    })

    const rows = response.data.values || []
    if (rows.length === 0) {
      return new Response(
        JSON.stringify(
          stages.map((stage) => ({
            name: stage.displayName,
            id: stage.id,
            color: stage.color,
            cards: [],
          }))
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

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

    const pipelineData = {}
    stages.forEach((stage) => {
      pipelineData[stage.name] = []
    })

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[COL.company]) continue

      const rawStage = (row[COL.stage] || '').trim()

      let matchedStage = rawStage
      if (!pipelineData[rawStage]) {
        const stageNum = rawStage.match(/^(\d)/)
        if (stageNum) {
          const found = stages.find(s => s.name.startsWith(stageNum[1] + '-'))
          if (found) matchedStage = found.name
        }
        if (!pipelineData[matchedStage]) {
          matchedStage = stages[0].name
        }
      }

      const card = {
        id: `${i}`,
        company: row[COL.company] || '',
        vertical: row[COL.vertical] || '',
        contact: row[COL.contact] || '',
        title: row[COL.title] || '',
        email: row[COL.email] || '',
        phone: row[COL.phone] || '',
        distributor: row[COL.distributor] || '',
        broker: row[COL.broker] || '',
        lastContact: row[COL.lastContact] || '',
        volume: row[COL.volume] || '',
        revenue: row[COL.revenue] || '',
        notes: row[COL.notes] || '',
        status: '',
        hasDraft: false,
        draftId: null,
      }

      pipelineData[matchedStage].push(card)
    }

    const result = stages.map((stage) => ({
      name: stage.displayName,
      id: stage.id,
      color: stage.color,
      cards: pipelineData[stage.name] || [],
    }))

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Pipeline API error:', error)

    const fallbackStages = stages.map((stage) => ({
      name: stage.displayName,
      id: stage.id,
      color: stage.color,
      cards: [],
    }))

    return new Response(JSON.stringify(fallbackStages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
