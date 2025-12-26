import { NextRequest, NextResponse } from 'next/server'

const GREEN_INVOICE_API = 'https://sandbox.d.greeninvoice.co.il/api/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, apiSecret } = body

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'Missing API key or secret' },
        { status: 400 }
      )
    }

    // Try to get a token with provided credentials
    const response = await fetch(`${GREEN_INVOICE_API}/account/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: apiKey,
        secret: apiSecret,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Green Invoice auth error:', errorText)
      return NextResponse.json(
        { success: false, error: 'פרטי ההתחברות שגויים' },
        { status: 401 }
      )
    }

    const data = await response.json()
    
    if (data.token) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'לא התקבל טוקן' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בבדיקת החיבור' },
      { status: 500 }
    )
  }
}