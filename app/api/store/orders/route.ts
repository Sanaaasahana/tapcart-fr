import { type NextRequest, NextResponse } from "next/server"
import { getStoreSession } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return neon(url)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getStoreSession()
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getSql()

    // Get all orders for this store
    const ordersResult = await sql`
      select * from orders
      where store_id = ${session.storeId}
      order by created_at desc
    `

    const orders = ordersResult as any[]

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemsResult = await sql`
          select * from order_items
          where order_id = ${order.order_id}
        `
        return {
          ...order,
          items: itemsResult,
        }
      })
    )

    return NextResponse.json({ orders: ordersWithItems })
  } catch (error) {
    console.error("Orders GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

