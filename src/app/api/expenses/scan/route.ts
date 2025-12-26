import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    console.log('Scanning receipt, image length:', image.length)

    // Extract base64 data and mime type from data URL
    // Format: data:image/jpeg;base64,/9j/4AAQ...
    let base64Data = image
    let mimeType = 'image/jpeg'
    
    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        mimeType = matches[1]
        base64Data = matches[2]
      }
    }

    // Map common mime types to Claude's supported types
    const mediaTypeMap: Record<string, string> = {
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
      'image/png': 'image/png',
      'image/gif': 'image/gif',
      'image/webp': 'image/webp',
      'application/pdf': 'application/pdf',
    }
    
    const mediaType = mediaTypeMap[mimeType] || 'image/jpeg'

    // If no Anthropic key, return mock data for testing
    if (!ANTHROPIC_API_KEY) {
      console.log('No ANTHROPIC_API_KEY, returning mock data')
      return NextResponse.json({
        vendor_name: 'ספק לדוגמה',
        amount: 100,
        vat_amount: 14.53,
        date: new Date().toISOString().split('T')[0],
        category: 'אחר',
        description: 'קבלה לדוגמה - הוסף ANTHROPIC_API_KEY לסריקה אמיתית',
      })
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: mediaType === 'application/pdf' ? 'document' : 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `Analyze this receipt/invoice and extract the following information. Return ONLY a JSON object, no explanation or markdown:
{
  "vendor_name": "שם העסק/הספק (business name)",
  "amount": number (total amount including VAT),
  "vat_amount": number (VAT amount, or calculate as amount * 17/117 if not shown),
  "date": "תאריך בפורמט YYYY-MM-DD",
  "category": "קטגוריה (one of: ציוד, תוכנה, שיווק, נסיעות, משרד, אחר)",
  "description": "תיאור קצר של הרכישה (brief description)"
}

IMPORTANT:
- Return null for fields that are not visible or unclear
- For Israeli receipts, look for Hebrew text
- Amount and vat_amount should be numbers only, no currency symbols
- For category, choose the most appropriate from the list
- Return ONLY valid JSON, nothing else`
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', response.status, error)
      throw new Error('AI analysis failed')
    }

    const result = await response.json()
    const content = result.content?.[0]?.text

    console.log('Claude response:', content)

    // Parse JSON from response
    let data
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      data = JSON.parse(cleanContent)
    } catch (e) {
      console.error('Failed to parse Claude response:', content)
      throw new Error('Failed to parse receipt data')
    }

    // Calculate VAT if not provided
    if (data.amount && !data.vat_amount) {
      data.vat_amount = Math.round((data.amount * 17 / 117) * 100) / 100
    }

    return NextResponse.json({
      vendor_name: data.vendor_name || '',
      amount: data.amount || 0,
      vat_amount: data.vat_amount || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'אחר',
      description: data.description || '',
    })

  } catch (error) {
    console.error('Receipt scan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    )
  }
}