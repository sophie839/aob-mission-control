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
const SHEET_NAME = 'Pipeline'
const RANGE = `${SHEET_NAME}!A1:Z1000`

const stages = [
  { name: 'Cold Outreach', id: 'cold', color: '--stage-cold' },
  { name: 'Follow-up', id: 'followup', color: '--stage-sent' },
  { name: 'Engaged', id: 'engaged', color: '--stage-engaged' },
  { name: 'Sample Sent', id: 'sample', color: '--stage-sample' },
  { name: 'Decision Pending', id: 'decision', color: '--stage-decision' },
  { name: 'Won', id: 'won', color: '--stage-won' },
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
        JSON.stringify({
          stages: stages.map((stage) => ({
            ...stage,
            cards: [],
          })),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const headers = rows[0]
    const companyIndex = headers.indexOf('Company')
    const contactIndex = headers.indexOf('Contact')
    const titleIndex = headers.indexOf('Title')
    const stageIndex = headers.indexOf('Stage')
    const emailIndex = headers.indexOf('Email')
    const statusIndex = headers.indexOf('Status')
    const notesIndex = headers.indexOf('Notes')

    const pipelineData = {}
    stages.forEach((stage) => {
      pipelineData[stage.name] = []
    })

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[companyIndex]) continue

      const stageName = row[stageIndex] || 'Cold Outreach'
      const card = {
        id: `${i}`,
        company: row[companyIndex] || '',
        contact: row[contactIndex] || '',
        title: row[titleIndex] || '',
        email: row[emailIndex] || '',
        status: row[statusIndex] || '',
        notes: row[notesIndex] || '',
        hasDraft: false,
        draftId: null,
      }

      if (pipelineData[stageName]) {
        pipelineData[stageName].push(card)
      }
    }

    const result = stages.map((stage) => ({
      ...stage,
      cards: pipelineData[stage.name] || [],
    }))

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Pipeline API error:', error)

    const fallbackStages = stages.map((stage) => ({
      ...stage,
      cards: [],
    }))

    return new Response(JSON.stringify(fallbackStages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
