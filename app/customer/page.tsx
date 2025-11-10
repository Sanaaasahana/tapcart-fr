"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ShoppingCart,
  Trash2,
  Check as Checkout,
  Radio,
  CheckCircle,
  X,
  Download,
  Package,
  CreditCard,
  Smartphone,
  Store,
  Tag,
  Phone,
  Lock,
  Gift,
} from "lucide-react"
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

  // Function to calculate totals
  const calculateTotal = () => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const total = subtotal - discount
    return { subtotal, total }
  }

  // Function to handle NFC reading
  const handleNfcRead = () => {
    // NFC reading logic here
  }

  // Function to handle checkout
  const handleCheckout = () => {
    setIsCheckoutOpen(true)
  }

  // Function to remove item from cart
  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((item) => item.id !== itemId))
  }

  // Function to send OTP
  const sendOTP = () => {
    // OTP sending logic here
    setOtpSent(true)
  }

  // Function to verify OTP
  const verifyOTP = () => {
    // OTP verification logic here
    setOtpVerified(true)
  }

  // Function to apply coupon
  const applyCoupon = () => {
    // Coupon application logic here
    setDiscount(10) // Example discount
  }

  // Function to process payment
  const processPayment = () => {
    // Payment processing logic here
    setPaymentConfirmed(true)
    setConfirmedOrderId("12345")
    setConfirmedBillUrl("https://example.com/bill")
    setIsCheckoutOpen(false)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted || !isCartLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary mb-6 shadow-lg">
            <ShoppingCart className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-foreground/60 text-sm font-medium">Loading your cart...</p>
        </div>
      </div>
    )
  }

  // Calculate totals only after component is mounted and cart is loaded to prevent hydration mismatch
  const totals = calculateTotal()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary))_0%,transparent_50%)] opacity-5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--accent))_0%,transparent_50%)] opacity-5"></div>

      <div className="container mx-auto px-4 py-8 sm:py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Payment Confirmation Alert */}
          {paymentConfirmed && confirmedOrderId && (
            <Alert className="mb-8 bg-white border border-border shadow-lg rounded-2xl overflow-hidden">
              <div className="flex items-start gap-4 p-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <AlertTitle className="text-foreground font-semibold text-lg mb-2">Payment Confirmed ✓</AlertTitle>
                  <AlertDescription className="text-foreground/70 mb-4">
                    <p className="mb-4 text-base">
                      Your order <span className="font-semibold text-foreground">{confirmedOrderId}</span> has been
                      confirmed successfully.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {confirmedBillUrl && (
                        <Button
                          onClick={() => window.open(confirmedBillUrl, "_blank")}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm hover:shadow-md transition-all"
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
                        className="border-border text-foreground hover:bg-secondary hover:border-border"
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
          <div className="text-center mb-12 sm:mb-14">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary shadow-xl mb-6">
              <ShoppingCart className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-3 tracking-tight text-pretty">
              Shopping Cart
            </h1>
            <p className="text-foreground/60 text-base font-normal max-w-md mx-auto">
              Tap NFC tags or scan QR codes to quickly add products to your cart
            </p>
          </div>

          {/* NFC Reading Section */}
          <Card className="mb-8 bg-white border border-border shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="pb-5 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <CardTitle className="text-foreground text-lg font-semibold">NFC Tag Reader</CardTitle>
                  <CardDescription className="text-foreground/60 text-sm font-normal mt-1">
                    {isNfcSupported
                      ? "Tap your NFC-enabled device on a product tag to add items instantly"
                      : "NFC is not supported on your device. Please use a device with NFC capability."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                onClick={handleNfcRead}
                disabled={!isNfcSupported || isNfcReading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isNfcReading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    Reading NFC Tag...
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 mr-2" strokeWidth={2} />
                    Start NFC Reading
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Cart Section */}
          <Card
            className="bg-white border border-border shadow-md rounded-2xl overflow-hidden"
            suppressHydrationWarning
          >
            <CardHeader className="pb-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-3">
                      Your Cart
                      {cart.length > 0 && (
                        <span className="text-xs font-semibold px-3 py-1.5 bg-accent/20 text-accent rounded-full">
                          {cart.length} {cart.length === 1 ? "item" : "items"}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-foreground/60 text-sm font-normal mt-1" suppressHydrationWarning>
                      {cart.length === 0
                        ? "Your cart is empty. Tap on NFC tags to add products."
                        : `Review your items and proceed to checkout`}
                    </CardDescription>
                  </div>
                </div>
                {cart.length > 0 && (
                  <Button
                    onClick={handleCheckout}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-11 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Checkout className="w-5 h-5 mr-2" strokeWidth={2} />
                    Checkout
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-8" suppressHydrationWarning>
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                    <ShoppingCart className="w-10 h-10 text-foreground/40" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h3>
                  <p className="text-foreground/60 text-base">
                    Start shopping by tapping NFC tags or scanning QR codes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-5 bg-secondary hover:bg-muted rounded-xl border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-sm"
                    >
                      {/* Product Icon/Image Placeholder */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Package className="w-7 h-7 text-primary" strokeWidth={1.5} />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground mb-2 truncate">{item.product_name}</h3>
                        <div className="flex items-center gap-4 text-xs text-foreground/60 mb-2 flex-wrap">
                          <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded">
                            <Store className="w-3.5 h-3.5" strokeWidth={2} />
                            Store {item.store_id}
                          </span>
                          <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded">
                            Qty: <span className="font-semibold text-foreground">{item.quantity}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-foreground">₹{item.price.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="flex-shrink-0 text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg p-2.5 transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={2} />
                      </Button>
                    </div>
                  ))}

                  {/* Order Summary */}
                  <div className="mt-8 pt-8 border-t border-border space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/70 text-base font-medium">Subtotal</span>
                      <span className="text-lg font-semibold text-foreground">₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-200/50 px-4 py-3 rounded-xl">
                        <span className="text-base font-medium flex items-center gap-2 text-emerald-700">
                          <Gift className="w-4 h-4" strokeWidth={2} />
                          Discount Applied
                        </span>
                        <span className="text-lg font-bold text-emerald-700">-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-border bg-primary/5 px-4 py-4 rounded-xl">
                      <span className="text-xl font-bold text-foreground">Total</span>
                      <span className="text-3xl font-bold text-primary">₹{totals.total.toFixed(2)}</span>
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
        <DialogContent className="max-w-lg w-[95vw] sm:w-full bg-white border border-border shadow-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-6 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-foreground text-2xl font-bold">Secure Checkout</DialogTitle>
                <DialogDescription className="text-foreground/60 text-sm font-normal mt-1">
                  Verify your phone and select payment method
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-foreground text-sm font-semibold block mb-2">
                Phone Number
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4"
                    strokeWidth={2}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-foreground text-sm bg-white"
                  />
                </div>
                <Button
                  onClick={sendOTP}
                  disabled={otpSent}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-11 px-5 rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap disabled:opacity-50"
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
                <Label htmlFor="otp" className="text-foreground text-sm font-semibold block mb-2">
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
                    className="flex-1 h-11 text-lg text-center tracking-[0.2em] font-bold border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-foreground bg-white"
                    disabled={otpVerified}
                  />
                  {otpVerified ? (
                    <Button
                      disabled
                      className="bg-emerald-100 text-emerald-700 font-semibold text-sm h-11 px-4 rounded-xl whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" strokeWidth={2} />
                      Verified
                    </Button>
                  ) : (
                    <Button
                      onClick={verifyOTP}
                      disabled={isVerifying}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-11 px-4 rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 mr-1.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </>
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  )}
                </div>
                {otpVerified && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />
                    <p className="text-emerald-700 text-xs font-semibold">Phone number verified successfully</p>
                  </div>
                )}
              </div>
            )}

            {/* Coupon Code */}
            <div>
              <Label htmlFor="coupon" className="text-foreground text-sm font-semibold block mb-2">
                Coupon Code <span className="text-foreground/40 font-normal">(Optional)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 h-11 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-foreground text-sm bg-white"
                />
                <Button
                  onClick={applyCoupon}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-11 px-5 rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                >
                  <Tag className="w-4 h-4 mr-1.5" strokeWidth={2} />
                  Apply
                </Button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-foreground text-sm font-semibold mb-3 block">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <label
                  htmlFor="card"
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-primary/30 hover:bg-secondary"
                  }`}
                >
                  <RadioGroupItem value="card" id="card" className="w-5 h-5" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <Label htmlFor="card" className="text-foreground text-base font-semibold cursor-pointer flex-1">
                      Card Payment
                    </Label>
                  </div>
                </label>
                <label
                  htmlFor="upi"
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    paymentMethod === "upi"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-primary/30 hover:bg-secondary"
                  }`}
                >
                  <RadioGroupItem value="upi" id="upi" className="w-5 h-5" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <Label htmlFor="upi" className="text-foreground text-base font-semibold cursor-pointer flex-1">
                      UPI Payment
                    </Label>
                  </div>
                </label>
                <label
                  htmlFor="pay_at_desk"
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    paymentMethod === "pay_at_desk"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-primary/30 hover:bg-secondary"
                  }`}
                >
                  <RadioGroupItem value="pay_at_desk" id="pay_at_desk" className="w-5 h-5" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <Label
                      htmlFor="pay_at_desk"
                      className="text-foreground text-base font-semibold cursor-pointer flex-1"
                    >
                      Pay at Desk
                    </Label>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-6 bg-primary/5 px-4 py-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 font-semibold text-base">Total Amount</span>
                <span className="text-3xl font-bold text-primary">₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={processPayment}
              disabled={!otpVerified || !paymentMethod}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!otpVerified ? (
                <>
                  <Lock className="w-5 h-5 mr-2" strokeWidth={2} />
                  Verify OTP First
                </>
              ) : !paymentMethod ? (
                <>
                  <CreditCard className="w-5 h-5 mr-2" strokeWidth={2} />
                  Select Payment Method
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" strokeWidth={2} />
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
