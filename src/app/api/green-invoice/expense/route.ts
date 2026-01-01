import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GREEN_INVOICE_API = 'https://sandbox.d.greeninvoice.co.il/api/v1'
const API_KEY = process.env.GREEN_INVOICE_API_KEY || '5052bff6-5e6c-4531-b17c-a70b52242f31'
const API_SECRET = process.env.GREEN_INVOICE_API_SECRET || 'Fp_hjT2tEXIWiU4qBSMJ9Q'

async function getToken() {
  const response = await fetch(`${GREEN_INVOICE_API}/account/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: API_KEY,
      secret: API_SECRET,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token error: ${error}`)
  }

  const data = await response.json()
  return data.token
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Accept both camelCase and snake_case
    const expenseId = body.expenseId
    const vendorName = body.vendorName || body.vendor_name
    const amount = body.amount
    const vatAmount = body.vatAmount || body.vat_amount || 0
    const expenseDate = body.expenseDate || body.expense_date
    const description = body.description

    console.log('Expense sync request:', { expenseId, vendorName, amount, vatAmount, expenseDate, description })

    if (!expenseId || !vendorName || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: expenseId, vendorName, amount' },
        { status: 400 }
      )
    }

    // Get token
    const token = await getToken()
    console.log('Got token')

    // Format date as YYYY-MM-DD
    const dateObj = expenseDate ? new Date(expenseDate) : new Date()
    const formattedDate = dateObj.toISOString().split('T')[0]
    // Reporting date is first of month
    const reportingDate = formattedDate.substring(0, 7) + '-01'

    // Calculate VAT if not provided (17% in Israel)
    const vat = vatAmount || Math.round((amount * 17 / 117) * 100) / 100

    // Create expense using the correct format
    const expensePayload = {
      currency: 'ILS',
      amount: parseFloat(amount),
      vat: parseFloat(vat),
      date: formattedDate,
      reportingDate: reportingDate,
      documentType: 320,
      number: String(Date.now()), // Unique document number
      description: description || `הוצאה - ${vendorName}`,
      paymentType: 1, // Cash
      supplier: {
        name: vendorName,
        country: 'IL',
      },
      accountingClassification: {
        id: '1194de02-ba89-479b-a97a-f63bbbd1c80d',
      },
      addRecipient: true,
    }

    console.log('Sending to Green Invoice /expenses:', JSON.stringify(expensePayload, null, 2))

    const response = await fetch(`${GREEN_INVOICE_API}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(expensePayload),
    })

    const responseText = await response.text()
    console.log('Green Invoice response status:', response.status)
    console.log('Green Invoice response:', responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { rawResponse: responseText }
    }

    if (!response.ok) {
      const errorMessage = result.errorMessage || result.message || `API Error ${response.status}`
      console.error('Green Invoice error:', result)
      
      return NextResponse.json(
        { 
          error: errorMessage,
          errorCode: result.errorCode,
          details: result,
        },
        { status: response.status }
      )
    }

    // Update expense in Supabase
    const supabase = await createClient()
    await supabase
      .from('expenses')
      .update({
        synced_at: new Date().toISOString(),
        green_invoice_id: result.id,
      })
      .eq('id', expenseId)

    return NextResponse.json({
      success: true,
      greenInvoiceId: result.id,
      expense: result,
    })
  } catch (error) {
    console.error('Expense sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}