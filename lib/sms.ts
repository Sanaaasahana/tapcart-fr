/**
 * SMS Service Utility
 * Handles sending SMS messages via Twilio
 */

interface SMSOptions {
  to: string
  body: string
}

/**
 * Format phone number to E.164 format (required by Twilio)
 * @param phone - Phone number in any format
 * @returns Formatted phone number with country code
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "")
  
  // If phone doesn't start with country code, assume it's Indian (+91)
  // You can modify this logic based on your primary country
  if (cleaned.length === 10) {
    // Indian phone number - add +91
    return `+91${cleaned}`
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    // Already has country code
    return `+${cleaned}`
  } else if (cleaned.startsWith("+")) {
    // Already in E.164 format
    return cleaned
  } else {
    // Add + prefix
    return `+${cleaned}`
  }
}

/**
 * Send SMS using Twilio
 * @param options - SMS options including phone number and message
 * @returns Promise that resolves when SMS is sent
 */
export async function sendSMS(options: SMSOptions): Promise<void> {
  const { to, body } = options
  
  // Format phone number
  const formattedPhone = formatPhoneNumber(to)
  
  // Check if Twilio is configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  
  // Debug logging
  console.log(`[SMS] Attempting to send SMS:`)
  console.log(`[SMS] - To: ${formattedPhone} (original: ${to})`)
  console.log(`[SMS] - From: ${fromNumber || 'NOT SET'}`)
  console.log(`[SMS] - Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : 'NOT SET'}`)
  console.log(`[SMS] - Auth Token: ${authToken ? 'SET' : 'NOT SET'}`)
  
  // If Twilio is not configured, log and throw error
  if (!accountSid || !authToken || !fromNumber) {
    const missing = []
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID')
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN')
    if (!fromNumber) missing.push('TWILIO_PHONE_NUMBER')
    
    const errorMsg = `[SMS] Twilio not configured. Missing: ${missing.join(', ')}`
    console.error(errorMsg)
    console.error(`[SMS] Would send to ${formattedPhone}: ${body}`)
    throw new Error(`Twilio configuration missing: ${missing.join(', ')}`)
  }
  
  try {
    // Import Twilio - Next.js API routes support require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio")
    const client = twilio(accountSid, authToken)
    
    console.log(`[SMS] Sending message via Twilio...`)
    
    // Send SMS
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedPhone,
    })
    
    console.log(`[SMS] ✅ Sent successfully to ${formattedPhone}`)
    console.log(`[SMS] Message SID: ${message.sid}`)
    console.log(`[SMS] Status: ${message.status}`)
  } catch (error: any) {
    console.error(`[SMS] ❌ Failed to send to ${formattedPhone}`)
    console.error(`[SMS] Error details:`, {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo,
    })
    
    // Provide specific error messages
    let errorMessage = 'Failed to send SMS'
    if (error.code === 21211) {
      errorMessage = `Invalid phone number format: ${formattedPhone}. Please check the number format.`
      console.error(`[SMS] 💡 Tip: Phone number should be in E.164 format (e.g., +919876543210)`)
    } else if (error.code === 21608) {
      errorMessage = `Unverified phone number: ${formattedPhone}. Add this number to Twilio verified numbers for testing.`
      console.error(`[SMS] 💡 Tip: Go to Twilio Console → Phone Numbers → Verified Caller IDs → Add ${formattedPhone}`)
    } else if (error.code === 21408) {
      errorMessage = `Permission denied. Check your Twilio account permissions.`
      console.error(`[SMS] 💡 Tip: Verify your Twilio account is active and has SMS permissions`)
    } else if (error.code === 21614) {
      errorMessage = `Invalid 'From' number: ${fromNumber}. Check your TWILIO_PHONE_NUMBER environment variable.`
      console.error(`[SMS] 💡 Tip: TWILIO_PHONE_NUMBER should be in E.164 format (e.g., +1234567890)`)
    } else if (error.code === 20003) {
      errorMessage = `Authentication failed. Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.`
      console.error(`[SMS] 💡 Tip: Verify your credentials in Twilio Console`)
    } else if (error.code === 21217) {
      errorMessage = `Invalid phone number. The number ${formattedPhone} is not valid.`
    } else {
      errorMessage = error.message || 'Unknown error occurred while sending SMS'
    }
    
    // Throw error so calling code can handle it
    throw new Error(errorMessage)
  }
}

/**
 * Send OTP via SMS
 * @param phone - Phone number
 * @param otp - OTP code
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<void> {
  const message = `Your OTP code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
  await sendSMS({ to: phone, body: message })
}

/**
 * Send order confirmation SMS
 * @param phone - Customer phone number
 * @param orderId - Order ID
 * @param billUrl - Bill download URL
 * @param paymentMethod - Payment method used
 */
export async function sendOrderConfirmationSMS(
  phone: string,
  orderId: string,
  billUrl: string,
  paymentMethod: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tapcart-fr.onrender.com"
  const fullBillUrl = `${baseUrl}${billUrl}`
  
  const message =
    paymentMethod === "pay_at_desk"
      ? `Your order ${orderId} has been placed. Please pay at the desk. Download your bill: ${fullBillUrl}`
      : `Your order ${orderId} has been confirmed. Download your bill: ${fullBillUrl}`
  
  await sendSMS({ to: phone, body: message })
}

