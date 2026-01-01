import { NextRequest, NextResponse } from 'next/server'

const EASYCOUNT_API = 'https://www.ezcount.co.il/api'
const EASYCOUNT_DEMO_API = 'https://demo.ezcount.co.il/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiKey = (body.apiKey || '').trim()
    const developerEmail = (body.developerEmail || '').trim()
    const useSandbox = body.useSandbox

    console.log('EasyCount test - Received:', { 
      apiKeyLength: apiKey.length,
      apiKeyPreview: apiKey.substring(0, 10) + '...',
      developerEmail,
      useSandbox 
    })

    if (!apiKey || !developerEmail) {
      return NextResponse.json(
        { success: false, error: 'חסר API Key או אימייל מפתח' },
        { status: 400 }
      )
    }

    const baseUrl = useSandbox ? EASYCOUNT_DEMO_API : EASYCOUNT_API
    console.log('Using URL:', baseUrl)

    // Test using getDocList - just checks auth without creating anything
    const payload = {
      api_key: apiKey,
      developer_email: developerEmail,
    }

    console.log('Testing auth with getDocList')

    const response = await fetch(`${baseUrl}/getDocList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log('EasyCount test response:', data)

    // Check for API key errors
    if (data.success === false) {
      // Auth errors - credentials are wrong
      if (data.errMsg?.includes('api_key') || 
          data.errMsg?.includes('api key') ||
          data.errMsg?.includes('API KEY') ||
          data.errMsg?.includes('unauthorized') ||
          data.errMsg?.includes('Autherization') ||
          data.errNum === 100) {
        return NextResponse.json({
          success: false,
          error: 'מפתח API או אימייל מפתח שגויים',
        })
      }

      return NextResponse.json({
        success: false,
        error: data.errMsg || 'שגיאה לא ידועה',
      })
    }

    // Success - got document list (even if empty)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('EasyCount test error:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בבדיקת החיבור' },
      { status: 500 }
    )
  }
}