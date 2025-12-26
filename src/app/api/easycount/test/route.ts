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

    // Test by creating a price quote (type 10)
    const payload = {
      api_key: apiKey,
      developer_email: developerEmail,
      type: 10,
      customer_name: 'בדיקת חיבור',
      item: [{
        details: 'בדיקה',
        amount: 1,
        price: 1,
      }],
    }

    console.log('Sending payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(`${baseUrl}/createDoc`, {
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
          data.errMsg?.includes('Autherization')) {
        return NextResponse.json({
          success: false,
          error: 'מפתח API או אימייל מפתח שגויים',
        })
      }

      // These errors mean auth PASSED but something else failed
      // Document type doesn't exist = auth worked, type not supported
      // Missing fields = auth worked, validation failed
      if (data.errMsg?.includes("document type") ||
          data.errMsg?.includes("doesn't exist") ||
          data.errMsg?.includes('חסר') || 
          data.errMsg?.includes('missing')) {
        console.log('Auth successful - document type not supported in sandbox')
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({
        success: false,
        error: data.errMsg || 'שגיאה לא ידועה',
      })
    }

    // Success!
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('EasyCount test error:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בבדיקת החיבור' },
      { status: 500 }
    )
  }
}