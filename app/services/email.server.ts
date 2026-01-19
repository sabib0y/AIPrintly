/**
 * Email Service
 *
 * Server-side email sending using Resend.
 * Handles transactional emails for order confirmations,
 * shipping notifications, and more.
 */

import { Resend } from 'resend'
import { getOrderById } from './orders.server'
import { formatPrice, formatDate } from '~/lib/utils'

// Validate Resend API key
const resendApiKey = process.env.RESEND_API_KEY
if (!resendApiKey) {
  console.warn('RESEND_API_KEY not set - emails will be logged but not sent')
}

/**
 * Resend client instance
 */
const resend = resendApiKey ? new Resend(resendApiKey) : null

/**
 * Default sender email
 */
const DEFAULT_FROM = process.env.EMAIL_FROM || 'AIPrintly <noreply@aiprintly.co.uk>'

/**
 * App URL for links in emails
 */
const APP_URL = process.env.APP_URL || 'http://localhost:5173'

/**
 * Email sending result
 */
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text content (optional)
 * @returns Email sending result
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  // If Resend is not configured, log the email
  if (!resend) {
    console.log('Email would be sent (Resend not configured):', {
      to,
      subject,
      htmlPreview: html.substring(0, 200),
    })
    return { success: true, messageId: 'mock-' + Date.now() }
  }

  try {
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('Email sending error:', error)
    return { success: false, error: message }
  }
}

/**
 * Send order confirmation email
 *
 * @param orderId - Order ID
 * @returns Email sending result
 */
export async function sendOrderConfirmationEmail(orderId: string): Promise<EmailResult> {
  const order = await getOrderById(orderId)

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  const shippingAddress = order.shippingAddress as Record<string, string>
  const trackingUrl = `${APP_URL}/orders/${order.trackingToken}`

  const subject = `Order Confirmed - ${order.orderNumber}`

  const html = generateOrderConfirmationHtml({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items.map((item) => ({
      name: item.productName,
      variant: item.variantName,
      quantity: item.quantity,
      totalPence: item.totalPricePence,
    })),
    subtotalPence: order.subtotalPence,
    shippingPence: order.shippingPence,
    totalPence: order.totalPence,
    shippingAddress: {
      line1: shippingAddress.addressLine1,
      line2: shippingAddress.addressLine2,
      city: shippingAddress.city,
      postcode: shippingAddress.postcode,
      country: shippingAddress.country || 'United Kingdom',
    },
    trackingUrl,
    orderDate: formatDate(order.createdAt),
  })

  const text = generateOrderConfirmationText({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalPence: order.totalPence,
    trackingUrl,
  })

  return sendEmail(order.customerEmail, subject, html, text)
}

/**
 * Send shipping notification email
 *
 * @param orderId - Order ID
 * @param trackingNumber - Carrier tracking number
 * @param trackingUrl - Carrier tracking URL
 * @param carrierName - Name of shipping carrier
 * @returns Email sending result
 */
export async function sendShippingNotificationEmail(
  orderId: string,
  trackingNumber: string,
  trackingUrl: string,
  carrierName: string
): Promise<EmailResult> {
  const order = await getOrderById(orderId)

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  const shippingAddress = order.shippingAddress as Record<string, string>
  const orderTrackingUrl = `${APP_URL}/orders/${order.trackingToken}`

  const subject = `Your Order is On Its Way - ${order.orderNumber}`

  const html = generateShippingNotificationHtml({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    trackingNumber,
    carrierTrackingUrl: trackingUrl,
    carrierName,
    orderTrackingUrl,
    shippingAddress: {
      line1: shippingAddress.addressLine1,
      line2: shippingAddress.addressLine2,
      city: shippingAddress.city,
      postcode: shippingAddress.postcode,
      country: shippingAddress.country || 'United Kingdom',
    },
  })

  const text = generateShippingNotificationText({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    trackingNumber,
    carrierTrackingUrl: trackingUrl,
    carrierName,
  })

  return sendEmail(order.customerEmail, subject, html, text)
}

// =============================================================================
// Email Template Generators
// =============================================================================

interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    variant: string
    quantity: number
    totalPence: number
  }>
  subtotalPence: number
  shippingPence: number
  totalPence: number
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  trackingUrl: string
  orderDate: string
}

function generateOrderConfirmationHtml(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 500;">${escapeHtml(item.name)}</div>
            <div style="font-size: 14px; color: #6b7280;">${escapeHtml(item.variant)}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.totalPence)}</td>
        </tr>
      `
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 24px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0ea5e9; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">AIPrintly</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Success Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; line-height: 64px;">
                  <span style="font-size: 32px;">✓</span>
                </div>
              </div>

              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; text-align: center;">Order Confirmed!</h2>

              <p style="margin: 0 0 24px 0; color: #4b5563; text-align: center;">
                Thank you for your order, ${escapeHtml(data.customerName.split(' ')[0])}!<br>
                We're preparing your items for shipment.
              </p>

              <!-- Order Details Box -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-size: 14px; color: #6b7280;">Order Number</div>
                      <div style="font-size: 18px; font-weight: 600; color: #111827; font-family: monospace;">${escapeHtml(data.orderNumber)}</div>
                    </td>
                    <td style="text-align: right;">
                      <div style="font-size: 14px; color: #6b7280;">Order Date</div>
                      <div style="font-size: 16px; color: #111827;">${escapeHtml(data.orderDate)}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Order Items -->
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 16px;">Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 8px 0; text-align: left; font-size: 14px; color: #6b7280;">Item</th>
                    <th style="padding: 8px 0; text-align: center; font-size: 14px; color: #6b7280;">Qty</th>
                    <th style="padding: 8px 0; text-align: right; font-size: 14px; color: #6b7280;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 8px 0; text-align: right; color: #6b7280;">Subtotal</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827;">${formatPrice(data.subtotalPence)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 0; text-align: right; color: #6b7280;">Shipping</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827;">${data.shippingPence === 0 ? 'Free' : formatPrice(data.shippingPence)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827; font-size: 18px;">Total</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827; font-size: 18px;">${formatPrice(data.totalPence)}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping Address -->
              <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">Shipping Address</h3>
              <div style="color: #4b5563; margin-bottom: 24px; line-height: 1.5;">
                ${escapeHtml(data.shippingAddress.line1)}<br>
                ${data.shippingAddress.line2 ? escapeHtml(data.shippingAddress.line2) + '<br>' : ''}
                ${escapeHtml(data.shippingAddress.city)}<br>
                ${escapeHtml(data.shippingAddress.postcode)}<br>
                ${escapeHtml(data.shippingAddress.country)}
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${escapeHtml(data.trackingUrl)}" style="display: inline-block; padding: 14px 32px; background-color: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Track Your Order
                </a>
              </div>

              <!-- What's Next -->
              <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">What happens next?</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; line-height: 1.6;">
                  <li>Your custom items will be printed within 1-2 working days</li>
                  <li>You'll receive a shipping notification with tracking details</li>
                  <li>Estimated delivery: 3-5 working days</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@aiprintly.co.uk" style="color: #0ea5e9;">support@aiprintly.co.uk</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AIPrintly - Custom AI-Generated Print Products
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function generateOrderConfirmationText(data: {
  orderNumber: string
  customerName: string
  totalPence: number
  trackingUrl: string
}): string {
  return `
Order Confirmed - ${data.orderNumber}

Thank you for your order, ${data.customerName}!

Your order (${data.orderNumber}) for ${formatPrice(data.totalPence)} has been confirmed and is being prepared for shipment.

Track your order: ${data.trackingUrl}

What happens next:
- Your custom items will be printed within 1-2 working days
- You'll receive a shipping notification with tracking details
- Estimated delivery: 3-5 working days

Need help? Contact us at support@aiprintly.co.uk

AIPrintly - Custom AI-Generated Print Products
  `.trim()
}

interface ShippingNotificationData {
  orderNumber: string
  customerName: string
  trackingNumber: string
  carrierTrackingUrl: string
  carrierName: string
  orderTrackingUrl: string
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
}

function generateShippingNotificationHtml(data: ShippingNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order is On Its Way</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 24px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0ea5e9; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">AIPrintly</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Package Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background-color: #dbeafe; border-radius: 50%; line-height: 64px;">
                  <span style="font-size: 32px;">📦</span>
                </div>
              </div>

              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; text-align: center;">Your Order is On Its Way!</h2>

              <p style="margin: 0 0 24px 0; color: #4b5563; text-align: center;">
                Great news, ${escapeHtml(data.customerName.split(' ')[0])}!<br>
                Your order has been shipped and is on its way to you.
              </p>

              <!-- Tracking Details Box -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-size: 14px; color: #6b7280;">Order Number</div>
                      <div style="font-size: 16px; font-weight: 600; color: #111827; font-family: monospace;">${escapeHtml(data.orderNumber)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 16px;">
                      <div style="font-size: 14px; color: #6b7280;">Tracking Number</div>
                      <div style="font-size: 16px; font-weight: 600; color: #111827; font-family: monospace;">${escapeHtml(data.trackingNumber)}</div>
                      <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">via ${escapeHtml(data.carrierName)}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${escapeHtml(data.carrierTrackingUrl)}" style="display: inline-block; padding: 14px 32px; background-color: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Track Your Package
                </a>
              </div>

              <!-- Shipping Address -->
              <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">Delivering To</h3>
              <div style="color: #4b5563; margin-bottom: 24px; line-height: 1.5;">
                ${escapeHtml(data.shippingAddress.line1)}<br>
                ${data.shippingAddress.line2 ? escapeHtml(data.shippingAddress.line2) + '<br>' : ''}
                ${escapeHtml(data.shippingAddress.city)}<br>
                ${escapeHtml(data.shippingAddress.postcode)}<br>
                ${escapeHtml(data.shippingAddress.country)}
              </div>

              <!-- Additional Info -->
              <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">What to expect</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; line-height: 1.6;">
                  <li>Estimated delivery: 3-5 working days</li>
                  <li>You may receive a text or email from the carrier</li>
                  <li>Someone may need to sign for the package</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${escapeHtml(data.orderTrackingUrl)}" style="color: #0ea5e9; font-size: 14px;">View Order Details</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@aiprintly.co.uk" style="color: #0ea5e9;">support@aiprintly.co.uk</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                AIPrintly - Custom AI-Generated Print Products
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function generateShippingNotificationText(data: {
  orderNumber: string
  customerName: string
  trackingNumber: string
  carrierTrackingUrl: string
  carrierName: string
}): string {
  return `
Your Order is On Its Way - ${data.orderNumber}

Great news, ${data.customerName}!

Your order (${data.orderNumber}) has been shipped and is on its way to you.

Tracking Number: ${data.trackingNumber}
Carrier: ${data.carrierName}

Track your package: ${data.carrierTrackingUrl}

What to expect:
- Estimated delivery: 3-5 working days
- You may receive a text or email from the carrier
- Someone may need to sign for the package

Need help? Contact us at support@aiprintly.co.uk

AIPrintly - Custom AI-Generated Print Products
  `.trim()
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}
