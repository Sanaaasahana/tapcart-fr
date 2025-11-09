"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Trash2, Check as Checkout, Radio, CheckCircle, X, Download } from "lucide-react"
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

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

      console.log("handleAddProductFromUrl called with:", { productId, storeId })

      try {
        const apiUrl = `/api/customer/product?productId=${encodeURIComponent(productId)}&storeId=${encodeURIComponent(storeId)}`
        console.log("Fetching product from:", apiUrl)

        const response = await fetch(apiUrl)
        console.log("API response status:", response.status)

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
        console.log("Product data received:", data)
        const product = data.product

        if (!product) {
          console.error("Product not found in response")
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

        console.log("Adding item to cart:", newItem)
        const updatedCart = [...currentCart, newItem]
        console.log("Updated cart:", updatedCart)

        // Update both state and localStorage
        setCart(updatedCart)
        try {
          localStorage.setItem("customer_cart", JSON.stringify(updatedCart))
          console.log("Cart saved to localStorage")
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
        console.log("URL parameters cleaned up")
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
    console.log("URL params useEffect running:", {
      isMounted,
      hasProcessedUrlParams,
      isCartLoaded,
    })

    if (typeof window === "undefined" || !isMounted || hasProcessedUrlParams || !isCartLoaded) {
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const storeId = urlParams.get("storeId")
    const productId = urlParams.get("productId")

    console.log("URL params found:", { storeId, productId })

    if (storeId && productId) {
      console.log("Processing URL parameters:", { storeId, productId })
      setHasProcessedUrlParams(true)
      // Call handleAddProductFromUrl directly - it's in scope and available
      handleAddProductFromUrl(productId, storeId).catch((error: unknown) => {
        console.error("Error adding product from URL:", error)
      })
    }
  }, [hasProcessedUrlParams, isCartLoaded, isMounted, handleAddProductFromUrl])

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
      const reader = new window.NDEFReader()
      await reader.scan()

      reader.addEventListener("reading", async (event: any) => {
        try {
          const record = event.message.records[0]
          const url = new TextDecoder().decode(record.data)
          console.log("NFC URL decoded:", url)

          let productId: string | null = null
          let storeId: string | null = null

          // Try to parse as full URL first (e.g., https://tapcart-fr.onrender.com/customer?storeId=X&productId=Y)
          try {
            const urlObj = new URL(url)
            const params = new URLSearchParams(urlObj.search)
            productId = params.get("productId")
            storeId = params.get("storeId")
            console.log("Parsed from full URL:", { productId, storeId })
          } catch (e) {
            // If not a full URL, try parsing as productID/storeID/website.com format
            const urlParts = url.split("/")
            if (urlParts.length >= 3) {
              productId = urlParts[0]
              storeId = urlParts[1]
              console.log("Parsed from path format:", { productId, storeId })
            } else if (urlParts.length === 2) {
              // Try productID/storeID format
              productId = urlParts[0]
              storeId = urlParts[1]
              console.log("Parsed from simple format:", { productId, storeId })
            }
          }

          if (productId && storeId) {
            // Add product to cart
            await addProductToCart(productId, storeId)
          } else {
            console.error("Could not parse productId and storeId from NFC URL:", url)
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
      console.log("addProductToCart called with:", { productId, storeId })
      const apiUrl = `/api/customer/product?productId=${encodeURIComponent(productId)}&storeId=${encodeURIComponent(storeId)}`
      console.log("Fetching product from:", apiUrl)

      const response = await fetch(apiUrl)
      console.log("API response status:", response.status)

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
      console.log("Product data received:", data)

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

      if (response.ok) {
        setOtpSent(true)
        toast({
          title: "OTP sent",
          description: "Please check your phone for the OTP code.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not send OTP. Please try again.",
          variant: "destructive",
        })
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  // Calculate totals only after component is mounted and cart is loaded to prevent hydration mismatch
  const totals = calculateTotal()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Payment Confirmation Alert */}
          {paymentConfirmed && confirmedOrderId && (
            <Alert className="mb-6 bg-green-900/20 border-green-500/50 text-white">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <AlertTitle className="text-green-400 font-semibold">Payment Confirmed!</AlertTitle>
              <AlertDescription className="text-white mt-2">
                <p className="mb-3">
                  Your order <strong className="font-bold">{confirmedOrderId}</strong> has been confirmed successfully.
                </p>
                {confirmedBillUrl && (
                  <Button
                    onClick={() => window.open(confirmedBillUrl, "_blank")}
                    className="bg-green-600 hover:bg-green-700 text-white"
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
                  variant="ghost"
                  className="ml-2 text-white hover:bg-white/10"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Customer Shopping</h1>
            <p className="text-slate-300 text-lg">Tap on NFC tags to add products to your cart</p>
          </div>

          {/* NFC Reading Section */}
          <Card className="mb-6 bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Radio className="w-5 h-5" />
                NFC Tag Reader
              </CardTitle>
              <CardDescription className="text-slate-300">
                {isNfcSupported
                  ? "Click the button below and tap your NFC-enabled device on a product tag"
                  : "NFC is not supported on your device. Please use a device with NFC capability."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleNfcRead}
                disabled={!isNfcSupported || isNfcReading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                size="lg"
              >
                {isNfcReading ? (
                  <>
                    <Radio className="w-5 h-5 mr-2 animate-pulse" />
                    Reading NFC Tag...
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 mr-2" />
                    Start NFC Reading
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Cart Section */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10" suppressHydrationWarning>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Cart
                  </CardTitle>
                  <CardDescription className="text-slate-300" suppressHydrationWarning>
                    {cart.length === 0
                      ? "Your cart is empty. Tap on NFC tags to add products."
                      : `${cart.length} item${cart.length > 1 ? "s" : ""} in your cart`}
                  </CardDescription>
                </div>
                {cart.length > 0 && (
                  <Button
                    onClick={handleCheckout}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Checkout className="w-4 h-4 mr-2" />
                    Checkout
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent suppressHydrationWarning>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No items in cart</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{item.product_name}</h3>
                        <p className="text-slate-400 text-sm">Store ID: {item.store_id}</p>
                        <p className="text-cyan-400 font-bold mt-1">₹{item.price.toFixed(2)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex justify-between text-slate-300 mb-2">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-400 mb-2">
                        <span>Discount:</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                      <span>Total:</span>
                      <span>₹{totals.total.toFixed(2)}</span>
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
        <DialogContent className="max-w-md w-[95vw] sm:w-full bg-slate-800 border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl sm:text-2xl">Checkout</DialogTitle>
            <DialogDescription className="text-slate-300 text-sm sm:text-base">
              Enter your phone number and verify with OTP to proceed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 sm:space-y-4">
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-white text-base sm:text-sm font-medium block mb-2">
                Phone Number
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-700 border-white/20 text-white h-14 sm:h-10 text-lg sm:text-base px-4"
                />
                <Button 
                  onClick={sendOTP} 
                  disabled={otpSent} 
                  className="bg-blue-600 hover:bg-blue-700 h-14 sm:h-10 text-base sm:text-sm whitespace-nowrap"
                >
                  {otpSent ? "Sent" : "Send OTP"}
                </Button>
              </div>
            </div>

            {/* OTP */}
            {otpSent && (
              <div>
                <Label htmlFor="otp" className="text-white text-base sm:text-sm font-medium block mb-2">
                  Enter OTP
                </Label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="bg-slate-700 border-white/20 text-white h-14 sm:h-10 text-xl sm:text-base text-center tracking-widest font-semibold px-4"
                    disabled={otpVerified}
                  />
                  {otpVerified ? (
                    <Button disabled className="bg-green-600 hover:bg-green-700 h-14 sm:h-10 text-base sm:text-sm whitespace-nowrap">
                      <CheckCircle className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                      Verified
                    </Button>
                  ) : (
                    <Button onClick={verifyOTP} disabled={isVerifying} className="bg-green-600 hover:bg-green-700 h-14 sm:h-10 text-base sm:text-sm whitespace-nowrap">
                      {isVerifying ? "Verifying..." : "Verify"}
                    </Button>
                  )}
                </div>
                {otpVerified && (
                  <p className="text-green-400 text-sm sm:text-xs mt-3 sm:mt-2 flex items-center gap-1">
                    <CheckCircle className="w-5 h-5 sm:w-4 sm:h-4" />
                    Phone number verified successfully
                  </p>
                )}
              </div>
            )}

            {/* Coupon Code */}
            <div>
              <Label htmlFor="coupon" className="text-white text-base sm:text-sm font-medium block mb-2">
                Coupon Code (Optional)
              </Label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <Input
                  id="coupon"
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-slate-700 border-white/20 text-white h-14 sm:h-10 text-base sm:text-sm px-4"
                />
                <Button onClick={applyCoupon} className="bg-purple-600 hover:bg-purple-700 h-14 sm:h-10 text-base sm:text-sm whitespace-nowrap">
                  Apply
                </Button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-white text-base sm:text-sm font-medium mb-3 sm:mb-2 block">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-3 sm:space-x-2 p-4 sm:p-3 bg-slate-700/50 rounded-lg mb-3 sm:mb-2 cursor-pointer hover:bg-slate-700/70 transition-colors">
                  <RadioGroupItem value="card" id="card" className="w-5 h-5 sm:w-4 sm:h-4" />
                  <Label htmlFor="card" className="text-white cursor-pointer text-base sm:text-sm flex-1">
                    Card Payment
                  </Label>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-2 p-4 sm:p-3 bg-slate-700/50 rounded-lg mb-3 sm:mb-2 cursor-pointer hover:bg-slate-700/70 transition-colors">
                  <RadioGroupItem value="upi" id="upi" className="w-5 h-5 sm:w-4 sm:h-4" />
                  <Label htmlFor="upi" className="text-white cursor-pointer text-base sm:text-sm flex-1">
                    UPI Payment
                  </Label>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-2 p-4 sm:p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                  <RadioGroupItem value="pay_at_desk" id="pay_at_desk" className="w-5 h-5 sm:w-4 sm:h-4" />
                  <Label htmlFor="pay_at_desk" className="text-white cursor-pointer text-base sm:text-sm flex-1">
                    Pay at Desk
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Total */}
            <div className="border-t border-white/10 pt-5 sm:pt-4">
              <div className="flex justify-between text-white font-bold text-xl sm:text-lg">
                <span>Total Amount:</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={processPayment}
              disabled={!otpVerified || !paymentMethod}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed h-14 sm:h-12 text-base sm:text-sm font-semibold"
            >
              {!otpVerified ? "Verify OTP First" : !paymentMethod ? "Select Payment Method" : "Complete Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
