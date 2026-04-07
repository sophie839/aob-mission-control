export function getHeaderValue(headers, name) {
  if (!headers) return ''
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )
  return header ? header.value : ''
}

export function extractMessageBody(payload) {
  if (!payload) return ''

  // Simple text body
  if (payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  // Multipart - look for text/plain first, then text/html
  if (payload.parts) {
    // Try text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data)
      }
    }
    // Fall back to text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return stripHtml(decodeBase64(part.body.data))
      }
    }
    // Recurse into nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractMessageBody(part)
        if (nested) return nested
      }
    }
  }

  return ''
}

function decodeBase64(data) {
  try {
    return Buffer.from(data, 'base64url').toString('utf-8')
  } catch {
    try {
      return Buffer.from(data, 'base64').toString('utf-8')
    } catch {
      return ''
    }
  }
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500)
}

export function truncate(str, maxLen = 120) {
  if (!str || str.length <= maxLen) return str || ''
  return str.substring(0, maxLen).trim() + '...'
}
