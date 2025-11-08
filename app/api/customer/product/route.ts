import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return neon(url)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("productId")
    const storeId = searchParams.get("storeId")

    if (!productId || !storeId) {
      return NextResponse.json({ error: "Product ID and Store ID are required" }, { status: 400 })
    }

    const sql = getSql()

    // Get product by custom_id or id
    let product
    if (isNaN(Number(productId))) {
      // It's a custom_id
      product = await sql`
        select id, store_id, name, (price::float) as price, (stock::int) as stock, custom_id
        from products
        where store_id = ${storeId} and custom_id = ${productId} and stock > 0
        limit 1
      `
    } else {
      // It's a numeric id
      product = await sql`
        select id, store_id, name, (price::float) as price, (stock::int) as stock, custom_id
        from products
        where store_id = ${storeId} and id = ${Number(productId)} and stock > 0
        limit 1
      `
    }

    if (!product || product.length === 0) {
      return NextResponse.json(
        { error: "Product not found or out of stock" },
        { status: 404 }
      )
    }

    return NextResponse.json({ product: product[0] })
  } catch (error) {
    console.error("Product GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

