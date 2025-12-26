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
      .select('green_invoice_api_key, green_invoice_api_secret, green_invoice_sandbox, business_type')
      .eq('id', user.id)
      .single()

    if (!profile?.green_invoice_api_key || !profile?.green_invoice_api_secret) {
      return NextResponse.json({ 
        success: false, 
        error: 'Green Invoice not configured. Please add your API keys in Settings.' 
      })
    }

    const { client, amount, description, remarks, payment_type, vat_included, document_type } = await request.json()

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
      return NextResponse.json({ 
        success: false, 
        error: tokenData.errorMessage || 'Authentication failed' 
      })
    }

    const token = tokenData.token

    // Determine VAT type based on document type
    // 0 = exempt, 1 = included, 2 = not included
    const isExempt = document_type === 400
    const vatType = isExempt ? 0 : 1

    // Calculate amounts
    let amountExcludeVat, vatAmount, totalAmount

    if (isExempt) {
      // עוסק פטור - no VAT
      amountExcludeVat = amount
      vatAmount = 0
      totalAmount = amount
    } else if (vat_included) {
      // Amount includes VAT
      totalAmount = amount
      amountExcludeVat = Math.round((amount / 1.17) * 100) / 100
      vatAmount = Math.round((totalAmount - amountExcludeVat) * 100) / 100
    } else {
      // Amount excludes VAT
      amountExcludeVat = amount
      vatAmount = Math.round((amount * 0.17) * 100) / 100
      totalAmount = amountExcludeVat + vatAmount
    }

    // Build document data
    const documentData: Record<string, unknown> = {
      type: document_type,
      lang: 'he',
      currency: 'ILS',
      vatType: vatType,
      rounding: true,
      description: description,
      remarks: remarks,
      client: {
        name: client.name + (client.partner_name ? ` & ${client.partner_name}` : ''),
        phone: client.phone || undefined,
        emails: client.email ? [client.email] : [],
        add: true
      },
      income: [
        {
          description: description,
          quantity: 1,
          price: amountExcludeVat,
          currency: 'ILS',
          vatType: vatType
        }
      ]
    }

    // Add payment if payment type is not "not paid" (-1)
    if (payment_type !== -1) {
      documentData.payment = [
        {
          type: payment_type,
          price: totalAmount,
          currency: 'ILS',
          date: new Date().toISOString().split('T')[0],
          remark: description
        }
      ]
    }

    console.log('Creating document:', JSON.stringify(documentData, null, 2))

    // Create document in Green Invoice
    const docResponse = await fetch(`${baseUrl}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(documentData)
    })

    const docResult = await docResponse.json()

    console.log('Green Invoice response:', JSON.stringify(docResult, null, 2))

    if (!docResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: docResult.errorMessage || 'Failed to create invoice',
        details: docResult
      })
    }

    // Save invoice to our database
    const { data: invoice, error: dbError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: client.id,
        green_invoice_id: docResult.id,
        document_number: docResult.number,
        document_type: document_type,
        amount: totalAmount,
        vat: vatAmount,
        description: description,
        payment_type: payment_type,
        document_url: docResult.url?.origin || docResult.url?.he || null,
        status: 'created'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
    }

    return NextResponse.json({ 
      success: true, 
      invoice: docResult,
      localInvoice: invoice
    })

  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 })
  }
}