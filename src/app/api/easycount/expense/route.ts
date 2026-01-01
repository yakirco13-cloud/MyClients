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

    console.log('EasyCount expense sync:', { expenseId, vendorName, amount, useSandbox })

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

    // Create expense document
    // type 320 = חשבונית מס (Tax Invoice) - commonly available
    // type 400 = קבלה (Receipt) - most commonly available
    const expensePayload = {
      api_key: apiKey,
      developer_email: developerEmail,
      type: 320, // חשבונית מס - more likely to be available
      
      customer_name: vendorName,
      customer_crn: vendorTaxId || undefined,
      
      item: [{
        details: description || `הוצאה - ${vendorName}`,
        amount: 1,
        price: amount,
      }],
      
      payment: [{
        payment_type: 1, // Cash
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
      // If document type doesn't exist in sandbox, still mark as synced for testing
      if (useSandbox && (result.errMsg?.includes("document type") || result.errMsg?.includes("doesn't exist"))) {
        console.log('Sandbox mode - document type not supported, marking as synced anyway')
        
        const supabase = await createClient()
        const { error } = await supabase
          .from('expenses')
          .update({
            green_invoice_synced: true,
            green_invoice_id: 'sandbox-test',
          })
          .eq('id', expenseId)

        if (error) {
          console.error('Failed to update expense in sandbox mode:', error)
          return NextResponse.json(
            { error: 'שגיאה בעדכון ההוצאה' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'מצב בדיקה - סומן כסונכרן',
          sandbox: true,
        })
      }

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
    const { error } = await supabase
      .from('expenses')
      .update({
        green_invoice_synced: true,
        green_invoice_id: result.doc_uuid || result.doc_number,
      })
      .eq('id', expenseId)

    if (error) {
      console.error('Failed to update expense:', error)
      return NextResponse.json(
        { error: 'שגיאה בעדכון ההוצאה' },
        { status: 500 }
      )
    }

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