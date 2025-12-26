import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EASYCOUNT_API = 'https://www.ezcount.co.il/api'
const EASYCOUNT_DEMO_API = 'https://demo.ezcount.co.il/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      amount,
      description,
      paymentType = 1, // Default: Cash
      apiKey,
      developerEmail,
      useSandbox,
      documentType = 400, // Default: Receipt (קבלה) - works for all business types
    } = body

    console.log('EasyCount invoice creation:', { clientId, clientName, amount, paymentType, documentType })

    if (!clientName || !amount) {
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
    const today = new Date()
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

    // Create invoice document
    // Document types in EZcount:
    // 10 = הצעת מחיר (Price Quote)
    // 100 = הזמנה (Order)
    // 305 = חשבונית מס (Tax Invoice) - NOT for עוסק פטור
    // 320 = חשבונית מס קבלה (Tax Invoice + Receipt) - NOT for עוסק פטור
    // 330 = חשבונית זיכוי (Credit Invoice)
    // 400 = קבלה (Receipt) - Works for ALL business types ✓
    // 405 = קבלה על תרומה (Donation Receipt)
    
    // Payment types in EZcount:
    // 1 = מזומן (Cash)
    // 2 = צ'ק (Check)
    // 3 = אשראי (Credit Card)
    // 4 = העברה בנקאית (Bank Transfer)
    // 5 = אחר (Other)
    // 10 = אפליקציה (App - Bit/PayBox)
    
    const invoicePayload = {
      api_key: apiKey,
      developer_email: developerEmail,
      type: documentType,
      
      // Customer info
      customer_name: clientName,
      customer_email: clientEmail || undefined,
      customer_phone: clientPhone || undefined,
      
      // Items
      item: [{
        details: description || 'שירותי DJ לאירוע',
        amount: 1,
        price: amount,
      }],
      
      // Payment
      payment: [{
        payment_type: paymentType,
        payment_sum: amount,
        date: formattedDate,
      }],
      
      // Options
      price_total: amount,
      send_email: clientEmail ? 1 : 0,
      email_text: clientEmail ? `שלום ${clientName},\n\nמצורפת קבלה עבור השירותים.\n\nתודה רבה!` : undefined,
    }

    console.log('Sending invoice to EasyCount:', JSON.stringify(invoicePayload, null, 2))

    const response = await fetch(`${baseUrl}/createDoc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload),
    })

    const result = await response.json()
    console.log('EasyCount response:', result)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.errMsg || 'שגיאה ביצירת חשבונית',
          details: result,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      documentId: result.doc_uuid,
      documentNumber: result.doc_number,
      documentUrl: result.pdf_link,
      pdfUrl: result.pdf_link_copy,
    })

  } catch (error) {
    console.error('EasyCount invoice error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'שגיאה לא צפויה' },
      { status: 500 }
    )
  }
}