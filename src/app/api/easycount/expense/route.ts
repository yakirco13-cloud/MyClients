import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EASYCOUNT_API = 'https://www.ezcount.co.il/api'
const EASYCOUNT_DEMO_API = 'https://demo.ezcount.co.il/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      expenseId, 
      vendorName, 
      vendorTaxId,
      amount, 
      vatAmount, 
      expenseDate, 
      description,
      apiKey,
      developerEmail,
      useSandbox 
    } = body

    console.log('EasyCount expense sync:', { expenseId, vendorName, amount })

    if (!expenseId || !vendorName || !amount) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      )
    }

    if (!apiKey || !developerEmail) {
      return NextResponse.json(
        { error: 'חסרים פרטי התחברות ל-EasyCount' },
        { status: 400 }
      )
    }

    const baseUrl = useSandbox ? EASYCOUNT_DEMO_API : EASYCOUNT_API

    // Format date as DD/MM/YYYY for EZcount
    const dateObj = expenseDate ? new Date(expenseDate) : new Date()
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`

    // Create expense as חשבונית עסקה (type 300)
    // Note: This appears in "מסמכים שיצרתי" not "הוצאות" - EasyCount limitation
    const expensePayload = {
      api_key: apiKey,
      developer_email: developerEmail,
      type: 300, // חשבונית עסקה
      
      customer_name: vendorName,
      customer_crn: vendorTaxId || undefined,
      
      item: [{
        details: description || `הוצאה - ${vendorName}`,
        amount: 1,
        price: amount,
      }],
      
      payment: [{
        payment_type: 1,
        payment_sum: amount,
        date: formattedDate,
      }],
      
      price_total: amount,
      created_date: formattedDate,
    }

    console.log('Sending expense to EasyCount:', JSON.stringify(expensePayload, null, 2))

    const response = await fetch(`${baseUrl}/createDoc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expensePayload),
    })

    const result = await response.json()
    console.log('EasyCount response:', result)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.errMsg || 'שגיאה ביצירת מסמך',
          details: result,
        },
        { status: 400 }
      )
    }

    // Update expense in Supabase
    const supabase = await createClient()
    await supabase
      .from('expenses')
      .update({
        synced_at: new Date().toISOString(),
        green_invoice_id: result.doc_uuid || result.doc_number,
      })
      .eq('id', expenseId)

    return NextResponse.json({
      success: true,
      documentId: result.doc_uuid,
      documentNumber: result.doc_number,
      documentUrl: result.pdf_link,
    })

  } catch (error) {
    console.error('EasyCount expense error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'שגיאה לא צפויה' },
      { status: 500 }
    )
  }
}