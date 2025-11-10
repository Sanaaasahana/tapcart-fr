"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Trash2, Check as Checkout, Radio, CheckCircle, X, Download, Package, IndianRupee, CreditCard, Smartphone, Store, Tag, Phone, Lock, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CartItem {
  id: number
  product_id: number
  product_name: string
  store_id: string
  price: number
  quantity: number
}

export default function CustomerPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isNfcSupported, setIsNfcSupported] = useState(false)
  const [isNfcReading, setIsNfcReading] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)
  const [confirmedBillUrl, setConfirmedBillUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [hasProcessedUrlParams, setHasProcessedUrlParams] = useState(false)
  const [isCartLoaded, setIsCartLoaded] = useState(false)

  // Check for payment confirmation in URL
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const orderId = urlParams.get("orderId")
      const paymentStatus = urlParams.get("paymentStatus")
      const billUrl = urlParams.get("billUrl")
      
      if (orderId && paymentStatus === "confirmed") {
        setPaymentConfirmed(true)
        setConfirmedOrderId(orderId)
        if (billUrl) {
          setConfirmedBillUrl(decodeURIComponent(billUrl))
        }
        
        // Clean up URL parameters
        const newUrl = window.location.pathname
        window.history.replaceState({}, "", newUrl)
        
        toast({
          title: "Payment Confirmed",
          description: `Your order ${orderId} has been confirmed successfully!`,
        })
      }
    } catch (error) {
      console.error("Error checking payment confirmation:", error)
    }
  }, [toast])

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    try {
      // Check NFC support
      if ("NDEFReader" in window) {
        setIsNfcSupported(true)
      }

      // Load cart from localStorage
      const savedCart = localStorage.getItem("customer_cart")
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart)
        }
      }
    } catch (error) {
      console.error("Error initializing customer page:", error)
    } finally {
      setIsCartLoaded(true)
    }
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Save cart to localStorage
    try {
      localStorage.setItem("customer_cart", JSON.stringify(cart))
    } catch (error) {
      console.error("Error saving cart to localStorage:", error)
    }
  }, [cart])

  const handleAddProductFromUrl = useCallback(
    async (productId: string, storeId: string) => {
      // Only run on client side
      if (typeof window === "undefined") return

      try {
        const apiUrl = `/api/customer/product?productId=${encodeURIComponent(productId)}&storeId=${encodeURIComponent(storeId)}`
        const response = await fetch(apiUrl)

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          console.error("API error:", data)
          toast({
            title: "Product not found",
            description: data.error || `Product ${productId} is not available in store ${storeId}.`,
            variant: "destructive",
          })
          // Clean up URL parameters even on error
          const newUrl = window.location.pathname
          window.history.replaceState({}, "", newUrl)
          return
        }

        const data = await response.json()
        const product = data.product

        if (!product) {
          toast({
            title: "Product not found",
            description: "This product is not available in the store inventory.",
            variant: "destructive",
          })
          const newUrl = window.location.pathname
          window.history.replaceState({}, "", newUrl)
          return
        }

        // Get current cart from localStorage (more reliable than state during async operations)
        let currentCart: CartItem[] = []
        try {
          const savedCart = localStorage.getItem("customer_cart")
          if (savedCart) {
            currentCart = JSON.parse(savedCart)
            if (!Array.isArray(currentCart)) {
              currentCart = []
            }
          }
        } catch (error) {
          console.error("Error reading cart from localStorage:", error)
          currentCart = []
        }

        // Check if product already in cart
        const existingItem = currentCart.find((item: CartItem) => item.product_id === product.id)
        if (existingItem) {
          toast({
            title: "Product already in cart",
            description: "This product is already in your cart. You can only add it once.",
          })
          // Clean up URL parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, "", newUrl)
          return
        }

        // Check if cart has items from different store
        if (currentCart.length > 0 && currentCart[0].store_id !== storeId) {
          toast({
            title: "Different store",
            description: "You can only add products from the same store. Please clear your cart first.",
            variant: "destructive",
          })
          // Clean up URL parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, "", newUrl)
          return
        }

        // Add to cart
        const newItem: CartItem = {
          id: Date.now(),
          product_id: product.id,
          product_name: product.name,
          store_id: storeId,
          price: Number.parseFloat(product.price),
          quantity: 1,
        }

        const updatedCart = [...currentCart, newItem]

        // Update both state and localStorage
        setCart(updatedCart)
        try {
          localStorage.setItem("customer_cart", JSON.stringify(updatedCart))
        } catch (error) {
          console.error("Error saving cart to localStorage:", error)
        }

        toast({
          title: "Product added",
          description: `${product.name} has been added to your cart.`,
        })

        // Clean up URL parameters after adding to cart
        const newUrl = window.location.pathname
        window.history.replaceState({}, "", newUrl)
      } catch (error) {
        console.error("Error adding product from URL:", error)
        toast({
          title: "Error",
          description: "Could not add product to cart. Please try again.",
          variant: "destructive",
        })
        // Clean up URL parameters even on error
        const newUrl = window.location.pathname
        window.history.replaceState({}, "", newUrl)
      }
    },
    [toast],
  )

  useEffect(() => {
    // Only process URL params once after component is fully mounted
    if (typeof window === "undefined" || !isMounted || hasProcessedUrlParams || !isCartLoaded) {
      return
    }

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const storeId = urlParams.get("storeId")
      const productId = urlParams.get("productId")

      if (storeId && productId) {
        setHasProcessedUrlParams(true)
        handleAddProductFromUrl(productId, storeId).catch((error: unknown) => {
          console.error("Error adding product from URL:", error)
          setHasProcessedUrlParams(true) // Set to true even on error to prevent retries
        })
      } else {
        // No URL params to process, mark as processed
        setHasProcessedUrlParams(true)
      }
    } catch (error) {
      console.error("Error processing URL params:", error)
      setHasProcessedUrlParams(true) // Set to true on error to prevent retries
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, isCartLoaded]) // Removed handleAddProductFromUrl and hasProcessedUrlParams from deps to prevent loops

  const handleNfcRead = async () => {
    if (!isNfcSupported) {
      toast({
        title: "NFC not supported",
        description: "Your device doesn't support NFC reading.",
        variant: "destructive",
      })
      return
    }

    setIsNfcReading(true)
    try {
      const reader = new (window as any).NDEFReader()
      await reader.scan()

      reader.addEventListener("reading", async (event: any) => {
        try {
          const record = event.message.records[0]
          const url = new TextDecoder().decode(record.data)

          let productId: string | null = null
          let storeId: string | null = null

          // Try to parse as full URL first (e.g., https://tapcart-fr.onrender.com/customer?storeId=X&productId=Y)
          try {
            const urlObj = new URL(url)
            const params = new URLSearchParams(urlObj.search)
            productId = params.get("productId")
            storeId = params.get("storeId")
          } catch (e) {
            // If not a full URL, try parsing as productID/storeID/website.com format
            const urlParts = url.split("/")
            if (urlParts.length >= 3) {
              productId = urlParts[0]
              storeId = urlParts[1]
            } else if (urlParts.length === 2) {
              // Try productID/storeID format
              productId = urlParts[0]
              storeId = urlParts[1]
            }
          }

          if (productId && storeId) {
            // Add product to cart
            await addProductToCart(productId, storeId)
          } else {
            toast({
              title: "Invalid NFC tag",
              description: "The NFC tag format is invalid. Expected URL with productId and storeId parameters.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error reading NFC:", error)
          toast({
            title: "Error reading NFC",
            description: "Could not read the NFC tag. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsNfcReading(false)
        }
      })

      reader.addEventListener("readingerror", () => {
        setIsNfcReading(false)
        toast({
          title: "NFC read error",
          description: "Could not read the NFC tag. Please try again.",
          variant: "destructive",
        })
      })
    } catch (error) {
      setIsNfcReading(false)
      toast({
        title: "NFC error",
        description: "Could not start NFC reader. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const addProductToCart = async (productId: string, storeId: string) => {
    try {
      const apiUrl = `/api/customer/product?productId=${encodeURIComponent(productId)}&storeId=${encodeURIComponent(storeId)}`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error("API error:", data)
        toast({
          title: "Product not found",
          description: data.error || `Product ${productId} is not available in store ${storeId}.`,
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      const product = data.product

      // Check if product already in cart
      const existingItem = cart.find((item) => item.product_id === product.id)
      if (existingItem) {
        toast({
          title: "Product already in cart",
          description: "This product is already in your cart. You can only add it once.",
        })
        return
      }

      // Check if cart has items from different store
      if (cart.length > 0 && cart[0].store_id !== storeId) {
        toast({
          title: "Different store",
          description: "You can only add products from the same store. Please clear your cart first.",
          variant: "destructive",
        })
        return
      }

      // Add to cart
      const newItem: CartItem = {
        id: Date.now(),
        product_id: product.id,
        product_name: product.name,
        store_id: storeId,
        price: Number.parseFloat(product.price),
        quantity: 1,
      }

      setCart([...cart, newItem])
      toast({
        title: "Product added",
        description: `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not add product to cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((item) => item.id !== itemId))
    toast({
      title: "Removed",
      description: "Product removed from cart.",
    })
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      subtotal,
      discount,
      total: subtotal - discount,
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add products to your cart first.",
        variant: "destructive",
      })
      return
    }
    setIsCheckoutOpen(true)
  }

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/customer/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOtpSent(true)
        toast({
          title: "OTP sent",
          description: "Please check your phone for the OTP code.",
        })
        // In development, show OTP in console for testing
        if (data.otp && process.env.NODE_ENV === "development") {
          console.log(`[DEV] OTP for ${phone}: ${data.otp}`)
        }
      } else {
        const errorMsg = data.details || data.error || "Could not send OTP. Please try again."
        toast({
          title: "Error sending OTP",
          description: errorMsg,
          variant: "destructive",
        })
        // Log detailed error for debugging
        console.error("OTP send error:", data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not send OTP. Please try again.",
        variant: "destructive",
      })
    }
  }

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch("/api/customer/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpVerified(true)
        toast({
          title: "OTP verified",
          description: "Phone number verified successfully.",
        })
        // Proceed to payment selection
      } else {
        toast({
          title: "Invalid OTP",
          description: data.error || "The OTP code is incorrect. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not verify OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode) return

    try {
      const totals = calculateTotal()
      const response = await fetch("/api/customer/coupon/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          storeId: cart[0]?.store_id,
          amount: totals.subtotal,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setDiscount(data.discount || 0)
        toast({
          title: "Coupon applied",
          description: `Discount of ₹${data.discount} applied.`,
        })
      } else {
        toast({
          title: "Invalid coupon",
          description: data.error || "This coupon code is invalid or expired.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not apply coupon. Please try again.",
        variant: "destructive",
      })
    }
  }

  const processPayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Select payment method",
        description: "Please select a payment method.",
        variant: "destructive",
      })
      return
    }

    if (!otpVerified) {
      toast({
        title: "Verify OTP",
        description: "Please verify your phone number with OTP first.",
        variant: "destructive",
      })
      return
    }

    try {
      const totals = calculateTotal()
      const response = await fetch("/api/customer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          cart: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          storeId: cart[0]?.store_id,
          paymentMethod,
          couponCode: couponCode || null,
          discount,
          totalAmount: totals.total,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Clear cart and reset form
        setCart([])
        localStorage.removeItem("customer_cart")
        setPhone("")
        setOtp("")
        setOtpSent(false)
        setOtpVerified(false)
        setCouponCode("")
        setDiscount(0)
        setPaymentMethod("")

        // Close dialog
        setIsCheckoutOpen(false)

        // Show payment confirmation
        setPaymentConfirmed(true)
        setConfirmedOrderId(data.orderId || "")
        if (data.billUrl) {
          setConfirmedBillUrl(data.billUrl)
        }

        toast({
          title: "Order placed",
          description: "Your order has been placed successfully!",
        })

        // Show success message with download link
        if (data.billUrl) {
          setTimeout(() => {
            window.open(data.billUrl, "_blank")
          }, 500)
        }
      } else {
        toast({
          title: "Payment failed",
          description: data.error || "Could not process payment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not process payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted || !isCartLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 mb-4 shadow-md">
            <ShoppingCart className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-stone-600 text-sm font-medium">Loading your cart...</p>
        </div>
      </div>
    )
  }

  // Calculate totals only after component is mounted and cart is loaded to prevent hydration mismatch
  const totals = calculateTotal()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-teal-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.06)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(180,83,9,0.04)_0%,transparent_50%)]"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Payment Confirmation Alert */}
          {paymentConfirmed && confirmedOrderId && (
            <Alert className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/50 shadow-lg rounded-xl overflow-hidden">
              <div className="flex items-start gap-4 p-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-teal-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <AlertTitle className="text-teal-900 font-semibold text-lg mb-2">Payment Confirmed</AlertTitle>
                  <AlertDescription className="text-teal-800/80 mb-4">
                    <p className="mb-4 text-base">
                      Your order <span className="font-semibold text-teal-900">{confirmedOrderId}</span> has been confirmed successfully.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {confirmedBillUrl && (
                        <Button
                          onClick={() => window.open(confirmedBillUrl, "_blank")}
                          className="bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-sm hover:shadow-md transition-all"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Bill
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setPaymentConfirmed(false)
                          setConfirmedOrderId(null)
                          setConfirmedBillUrl(null)
                        }}
                        variant="outline"
                        className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 mb-5 shadow-md">
              <ShoppingCart className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-stone-800 mb-3 tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-stone-600 text-base font-normal">Tap NFC tags to add products or scan QR codes</p>
          </div>

          {/* NFC Reading Section */}
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:border-teal-200/60 transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-teal-600" strokeWidth={2} />
                </div>
                <CardTitle className="text-stone-800 text-lg font-semibold">NFC Tag Reader</CardTitle>
              </div>
              <CardDescription className="text-stone-600 text-sm font-normal">
                {isNfcSupported
                  ? "Tap your NFC-enabled device on a product tag to add items instantly"
                  : "NFC is not supported on your device. Please use a device with NFC capability."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleNfcRead}
                disabled={!isNfcSupported || isNfcReading}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isNfcReading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Reading NFC Tag...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 mr-2" strokeWidth={2} />
                    Start NFC Reading
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Cart Section */}
          <Card className="bg-white/90 backdrop-blur-sm border border-stone-200/60 shadow-md rounded-xl overflow-hidden" suppressHydrationWarning>
            <CardHeader className="pb-5 border-b border-stone-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-amber-700" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-stone-800 text-xl font-semibold flex items-center gap-3">
                      Your Cart
                      {cart.length > 0 && (
                        <span className="text-xs font-medium px-2.5 py-1 bg-teal-50 text-teal-700 rounded-md border border-teal-100">
                          {cart.length} {cart.length === 1 ? "item" : "items"}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-stone-600 text-sm font-normal mt-1" suppressHydrationWarning>
                      {cart.length === 0
                        ? "Your cart is empty. Tap on NFC tags to add products."
                        : `Review your items and proceed to checkout`}
                    </CardDescription>
                  </div>
                </div>
                {cart.length > 0 && (
                  <Button
                    onClick={handleCheckout}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-sm h-10 px-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Checkout className="w-4 h-4 mr-2" strokeWidth={2} />
                    Checkout
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6" suppressHydrationWarning>
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-5">
                    <ShoppingCart className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">Your cart is empty</h3>
                  <p className="text-stone-600 text-sm">Start shopping by tapping NFC tags or scanning QR codes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-4 bg-gradient-to-r from-white to-stone-50/50 rounded-lg border border-stone-200/60 hover:border-teal-200/60 hover:shadow-sm transition-all duration-200"
                    >
                      {/* Product Icon/Image Placeholder */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center border border-teal-100/50">
                        <Package className="w-6 h-6 text-teal-600" strokeWidth={1.5} />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-stone-800 mb-1 truncate">{item.product_name}</h3>
                        <div className="flex items-center gap-4 text-xs text-stone-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3" strokeWidth={2} />
                            Store {item.store_id}
                          </span>
                          <span className="flex items-center gap-1">
                            Qty: <span className="font-medium text-stone-700">{item.quantity}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-base font-semibold text-teal-700">₹{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="flex-shrink-0 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg p-2 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Order Summary */}
                  <div className="mt-6 pt-6 border-t border-stone-200 space-y-3">
                    <div className="flex justify-between items-center text-stone-700">
                      <span className="text-sm font-medium">Subtotal</span>
                      <span className="text-base font-semibold text-stone-800">₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5" strokeWidth={2} />
                          Discount
                        </span>
                        <span className="text-base font-semibold text-teal-800">-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-stone-200 bg-gradient-to-r from-teal-50/30 to-cyan-50/30 -mx-4 px-4 py-3 rounded-lg">
                      <span className="text-lg font-semibold text-stone-800">Total</span>
                      <span className="text-xl font-semibold text-teal-700">
                        ₹{totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full bg-white/95 backdrop-blur-sm border border-stone-200/60 shadow-xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader className="pb-5 border-b border-stone-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-teal-600" strokeWidth={2} />
              </div>
              <DialogTitle className="text-stone-800 text-xl font-semibold">Checkout</DialogTitle>
            </div>
            <DialogDescription className="text-stone-600 text-sm font-normal">
              Enter your phone number and verify with OTP to proceed with payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-stone-800 text-sm font-medium block mb-2">
                Phone Number
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" strokeWidth={2} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11 border border-stone-200 rounded-lg focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-all duration-200 text-stone-800 text-sm bg-white"
                  />
                </div>
                <Button 
                  onClick={sendOTP} 
                  disabled={otpSent} 
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-sm h-11 px-4 rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap disabled:opacity-50"
                >
                  {otpSent ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1.5" strokeWidth={2} />
                      Sent
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            </div>

            {/* OTP */}
            {otpSent && (
              <div>
                <Label htmlFor="otp" className="text-stone-800 text-sm font-medium block mb-2">
                  Enter OTP
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="flex-1 h-11 text-lg text-center tracking-[0.3em] font-semibold border border-stone-200 rounded-lg focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-all duration-200 text-stone-800 bg-white"
                    disabled={otpVerified}
                  />
                  {otpVerified ? (
                    <Button disabled className="bg-teal-50 text-teal-700 border border-teal-200 font-medium text-sm h-11 px-4 rounded-lg whitespace-nowrap">
                      <CheckCircle className="w-4 h-4 mr-1.5" strokeWidth={2} />
                      Verified
                    </Button>
                  ) : (
                    <Button 
                      onClick={verifyOTP} 
                      disabled={isVerifying} 
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-sm h-11 px-4 rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </>
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  )}
                </div>
                {otpVerified && (
                  <div className="mt-2.5 p-2.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" strokeWidth={2} />
                    <p className="text-teal-700 text-xs font-medium">Phone number verified successfully</p>
                  </div>
                )}
              </div>
            )}

            {/* Coupon Code */}
            <div>
              <Label htmlFor="coupon" className="text-stone-800 text-sm font-medium block mb-2">
                Coupon Code <span className="text-stone-500 font-normal">(Optional)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 h-11 border border-stone-200 rounded-lg focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all duration-200 text-stone-800 text-sm bg-white"
                />
                <Button 
                  onClick={applyCoupon} 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-sm h-11 px-4 rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                >
                  <Tag className="w-4 h-4 mr-1.5" strokeWidth={2} />
                  Apply
                </Button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-stone-800 text-sm font-medium mb-3 block">
                Payment Method
              </Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                <label
                  htmlFor="card"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    paymentMethod === "card"
                      ? "border-teal-400 bg-teal-50/50"
                      : "border-stone-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                  }`}
                >
                  <RadioGroupItem value="card" id="card" className="w-4 h-4" />
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      paymentMethod === "card" ? "bg-teal-100" : "bg-stone-100"
                    }`}>
                      <CreditCard className={`w-4 h-4 ${paymentMethod === "card" ? "text-teal-600" : "text-stone-600"}`} strokeWidth={2} />
                    </div>
                    <Label htmlFor="card" className="text-stone-800 text-sm font-medium cursor-pointer flex-1">
                      Card Payment
                    </Label>
                  </div>
                </label>
                <label
                  htmlFor="upi"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    paymentMethod === "upi"
                      ? "border-teal-400 bg-teal-50/50"
                      : "border-stone-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                  }`}
                >
                  <RadioGroupItem value="upi" id="upi" className="w-4 h-4" />
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      paymentMethod === "upi" ? "bg-teal-100" : "bg-stone-100"
                    }`}>
                      <Smartphone className={`w-4 h-4 ${paymentMethod === "upi" ? "text-teal-600" : "text-stone-600"}`} strokeWidth={2} />
                    </div>
                    <Label htmlFor="upi" className="text-stone-800 text-sm font-medium cursor-pointer flex-1">
                      UPI Payment
                    </Label>
                  </div>
                </label>
                <label
                  htmlFor="pay_at_desk"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    paymentMethod === "pay_at_desk"
                      ? "border-teal-400 bg-teal-50/50"
                      : "border-stone-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                  }`}
                >
                  <RadioGroupItem value="pay_at_desk" id="pay_at_desk" className="w-4 h-4" />
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      paymentMethod === "pay_at_desk" ? "bg-teal-100" : "bg-stone-100"
                    }`}>
                      <Store className={`w-4 h-4 ${paymentMethod === "pay_at_desk" ? "text-teal-600" : "text-stone-600"}`} strokeWidth={2} />
                    </div>
                    <Label htmlFor="pay_at_desk" className="text-stone-800 text-sm font-medium cursor-pointer flex-1">
                      Pay at Desk
                    </Label>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Total */}
            <div className="border-t border-stone-200 pt-5">
              <div className="flex justify-between items-center bg-gradient-to-r from-teal-50/50 to-cyan-50/50 -mx-6 px-6 py-4 rounded-lg">
                <span className="text-stone-700 font-medium text-base">Total Amount</span>
                <span className="text-xl font-semibold text-teal-700">
                  ₹{totals.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={processPayment}
              disabled={!otpVerified || !paymentMethod}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!otpVerified ? (
                <>
                  <Lock className="w-4 h-4 mr-2" strokeWidth={2} />
                  Verify OTP First
                </>
              ) : !paymentMethod ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" strokeWidth={2} />
                  Select Payment Method
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" strokeWidth={2} />
                  Complete Payment
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
