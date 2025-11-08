import { type NextRequest, NextResponse } from "next/server"
import { getStoreSession } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return neon(url)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getStoreSession()
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const sql = getSql()

    // Get order and verify it belongs to this store
    const orderResult = await sql`
      select * from orders
      where order_id = ${orderId} and store_id = ${session.storeId}
      limit 1
    `

    if (!orderResult || orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orderResult[0] as any

    if (order.payment_method !== "pay_at_desk") {
      return NextResponse.json(
        { error: "This order is not a pay-at-desk order" },
        { status: 400 }
      )
    }

    if (order.payment_status === "completed") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 })
    }

    // Update order status
    await sql`
      update orders
      set payment_status = 'completed',
          order_status = 'confirmed',
          paid_at = now(),
          approved_at = now()
      where order_id = ${orderId} and store_id = ${session.storeId}
    `

    // Send SMS to customer
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const billUrl = `${baseUrl}/api/customer/bill/${orderId}`
    
    // TODO: Integrate with SMS service
    console.log(`SMS to ${order.customer_phone}: Your order ${orderId} payment has been confirmed. Download your bill: ${billUrl}`)

    return NextResponse.json({
      success: true,
      message: "Order payment approved successfully",
    })
  } catch (error) {
    console.error("Order approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

