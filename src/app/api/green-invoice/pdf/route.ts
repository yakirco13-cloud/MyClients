import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Green Invoice credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('green_invoice_api_key, green_invoice_api_secret, green_invoice_sandbox')
      .eq('id', user.id)
      .single()

    if (!profile?.green_invoice_api_key || !profile?.green_invoice_api_secret) {
      return NextResponse.json({ 
        success: false, 
        error: 'Green Invoice not configured' 
      })
    }

    const { document_id } = await request.json()

    const baseUrl = profile.green_invoice_sandbox 
      ? 'https://sandbox.d.greeninvoice.co.il/api/v1'
      : 'https://api.greeninvoice.co.il/api/v1'

    // Get token
    const tokenResponse = await fetch(`${baseUrl}/account/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: profile.green_invoice_api_key, 
        secret: profile.green_invoice_api_secret 
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) {
      return NextResponse.json({ success: false, error: 'Authentication failed' })
    }

    const token = tokenData.token

    // Get document details
    const docResponse = await fetch(`${baseUrl}/documents/${document_id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!docResponse.ok) {
      return NextResponse.json({ success: false, error: 'Document not found' })
    }

    const docData = await docResponse.json()
    
    // Get PDF URL
    let pdfUrl = null
    if (docData.url) {
      if (typeof docData.url === 'string') {
        pdfUrl = docData.url
      } else {
        pdfUrl = docData.url.origin || docData.url.he
      }
    }

    if (!pdfUrl) {
      return NextResponse.json({ success: false, error: 'PDF URL not found' })
    }

    // Fetch PDF with authentication
    const pdfResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!pdfResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to download PDF' })
    }

    // Convert to base64
    const arrayBuffer = await pdfResponse.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return NextResponse.json({ 
      success: true, 
      pdf: base64,
      filename: `invoice-${docData.number}.pdf`
    })

  } catch (error) {
    console.error('PDF download error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}