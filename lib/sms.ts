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
  
  // If Twilio is not configured, log and return (for development)
  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[SMS] Twilio not configured. Would send to ${formattedPhone}: ${body}`)
    console.log(`[SMS] To enable real SMS, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables`)
    return
  }
  
  try {
    // Import Twilio - Next.js API routes support require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio")
    const client = twilio(accountSid, authToken)
    
    // Send SMS
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedPhone,
    })
    
    console.log(`[SMS] Sent successfully to ${formattedPhone}. Message SID: ${message.sid}`)
  } catch (error: any) {
    console.error(`[SMS] Failed to send to ${formattedPhone}:`, error)
    // Don't throw error - we don't want SMS failures to break the app
    // In production, you might want to log to an error tracking service
    if (error.code === 21211) {
      console.error(`[SMS] Invalid phone number format: ${formattedPhone}`)
    } else if (error.code === 21608) {
      console.error(`[SMS] Unverified phone number. Add ${formattedPhone} to Twilio verified numbers for testing.`)
    } else if (error.code === 21408) {
      console.error(`[SMS] Permission denied. Check your Twilio account permissions.`)
    } else if (error.code === 21614) {
      console.error(`[SMS] Invalid 'From' number. Check your TWILIO_PHONE_NUMBER environment variable.`)
    } else if (error.code === 20003) {
      console.error(`[SMS] Authentication failed. Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.`)
    }
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

