// Domains to always exclude from inbox
const EXCLUDE_DOMAINS = [
  'noreply', 'no-reply', 'mailer-daemon', 'postmaster',
  'notifications@', 'marketing@', 'newsletter@', 'updates@',
  'billing@', 'receipts@', 'support@', 'hello@getgorgie',
  'team@', 'info@', 'digest@',
]

const EXCLUDE_SENDERS = [
  'vercel.com', 'github.com', 'google.com', 'linkedin.com',
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'tiktok.com', 'amazon.com', 'stripe.com', 'squarespace.com',
  'mailchimp.com', 'klaviyo.com', 'shopify.com', 'delta.com',
  'alaskaair.com', 'united.com', 'southwest.com', 'zoom.us',
  'calendly.com', 'docusign.com', 'dropbox.com', 'notion.so',
  'slack.com', 'figma.com', 'canva.com', 'hubspot.com',
  'pulselabs.ai', 'jeffsu.org',
]

const EXCLUDE_SUBJECT_PATTERNS = [
  /unsubscribe/i, /newsletter/i, /digest/i, /weekly update/i,
  /your order/i, /your receipt/i, /payment confirmed/i,
  /password reset/i, /verify your/i, /confirm your/i,
  /invitation to/i, /shared a document/i,
  /failed.*deployment/i, /build failed/i,
  /check.in.*flight/i, /trip.*details/i,
  /security alert/i, /sign-in/i,
]

// Known B2B contacts and important domains to ALWAYS include
const PRIORITY_DOMAINS = [
  'sony.com', 'stockx.com', 'chanel.com', 'coinbase.com',
  'visa.com', 'marriott.com', 'dropbox.com', 'capitalone.com',
  'compass-usa.com', 'gfs.com', 'pfgc.com', 'deshaw.com',
  'vizientinc.com', 'kp.org', 'citadel.com', 'microsoft.com',
  'cafebonappetit.com', 'canyonranch.com', 'aexp.com',
  'iammorrison.com', 'ccl-hg.com', 'racrecovery.com',
  'sodexo.com', 'lyft.com', 'united.com', 'foodbuy.com',
  'usfoods.com', 'vistar.com',
]

export function isImportantEmail(from, subject) {
  const fromLower = (from || '').toLowerCase()
  const subjectLower = (subject || '').toLowerCase()

  // Always include emails from known B2B contacts
  for (const domain of PRIORITY_DOMAINS) {
    if (fromLower.includes(domain)) return true
  }

  // Exclude known noise domains
  for (const domain of EXCLUDE_SENDERS) {
    if (fromLower.includes(domain)) return false
  }

  // Exclude by sender pattern
  for (const pattern of EXCLUDE_DOMAINS) {
    if (fromLower.includes(pattern)) return false
  }

  // Exclude by subject pattern
  for (const pattern of EXCLUDE_SUBJECT_PATTERNS) {
    if (pattern.test(subjectLower)) return false
  }

  return true
}

export function calculateUrgency(from, subject, date) {
  const fromLower = (from || '').toLowerCase()
  const subjectLower = (subject || '').toLowerCase()

  // Known B2B contacts are always HIGH
  for (const domain of PRIORITY_DOMAINS) {
    if (fromLower.includes(domain)) return 'HIGH'
  }

  // Time-based urgency
  const msgDate = new Date(date)
  const hoursAgo = (Date.now() - msgDate.getTime()) / (1000 * 60 * 60)
  if (hoursAgo < 4) return 'HIGH'
  if (hoursAgo < 24) return 'MEDIUM'
  return 'LOW'
}

export function extractSenderName(fromHeader) {
  if (!fromHeader) return 'Unknown'
  // "John Doe <john@example.com>" → "John Doe"
  const match = fromHeader.match(/^"?([^"<]+)"?\s*</)
  if (match) return match[1].trim()
  // "john@example.com" → "john"
  const emailMatch = fromHeader.match(/([^@]+)@/)
  if (emailMatch) return emailMatch[1].replace(/[._]/g, ' ')
  return fromHeader.trim()
}

export function extractEmail(fromHeader) {
  if (!fromHeader) return ''
  const match = fromHeader.match(/<([^>]+)>/)
  if (match) return match[1].toLowerCase()
  if (fromHeader.includes('@')) return fromHeader.trim().toLowerCase()
  return ''
}
