/**
 * Order Confirmation Email Template
 *
 * React Email template for order confirmation emails.
 * Can be used with React Email library or as a reference.
 */

import * as React from 'react'

export interface OrderConfirmationEmailProps {
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

/**
 * Format price in pence to GBP string
 */
function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotalPence,
  shippingPence,
  totalPence,
  shippingAddress,
  trackingUrl,
  orderDate,
}: OrderConfirmationEmailProps) {
  const firstName = customerName.split(' ')[0]

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Order Confirmation</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: '#f9fafb',
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: '#f9fafb', padding: 24 }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  width={600}
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: '#0ea5e9',
                          padding: 24,
                          textAlign: 'center',
                        }}
                      >
                        <h1
                          style={{
                            margin: 0,
                            color: '#ffffff',
                            fontSize: 24,
                            fontWeight: 600,
                          }}
                        >
                          AIPrintly
                        </h1>
                      </td>
                    </tr>

                    {/* Content */}
                    <tr>
                      <td style={{ padding: 32 }}>
                        {/* Success Icon */}
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                          <div
                            style={{
                              display: 'inline-block',
                              width: 64,
                              height: 64,
                              backgroundColor: '#dcfce7',
                              borderRadius: '50%',
                              lineHeight: '64px',
                              fontSize: 32,
                            }}
                          >
                            ✓
                          </div>
                        </div>

                        <h2
                          style={{
                            margin: '0 0 16px 0',
                            color: '#111827',
                            fontSize: 24,
                            textAlign: 'center',
                          }}
                        >
                          Order Confirmed!
                        </h2>

                        <p
                          style={{
                            margin: '0 0 24px 0',
                            color: '#4b5563',
                            textAlign: 'center',
                          }}
                        >
                          Thank you for your order, {firstName}!
                          <br />
                          We&apos;re preparing your items for shipment.
                        </p>

                        {/* Order Details Box */}
                        <div
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 8,
                            padding: 20,
                            marginBottom: 24,
                          }}
                        >
                          <table width="100%" cellPadding={0} cellSpacing={0}>
                            <tbody>
                              <tr>
                                <td>
                                  <div
                                    style={{ fontSize: 14, color: '#6b7280' }}
                                  >
                                    Order Number
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 18,
                                      fontWeight: 600,
                                      color: '#111827',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {orderNumber}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div
                                    style={{ fontSize: 14, color: '#6b7280' }}
                                  >
                                    Order Date
                                  </div>
                                  <div style={{ fontSize: 16, color: '#111827' }}>
                                    {orderDate}
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Order Items */}
                        <h3
                          style={{
                            margin: '0 0 16px 0',
                            color: '#111827',
                            fontSize: 16,
                          }}
                        >
                          Order Items
                        </h3>
                        <table
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{ marginBottom: 24 }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: '2px solid #e5e7eb',
                              }}
                            >
                              <th
                                style={{
                                  padding: 8,
                                  textAlign: 'left',
                                  fontSize: 14,
                                  color: '#6b7280',
                                }}
                              >
                                Item
                              </th>
                              <th
                                style={{
                                  padding: 8,
                                  textAlign: 'center',
                                  fontSize: 14,
                                  color: '#6b7280',
                                }}
                              >
                                Qty
                              </th>
                              <th
                                style={{
                                  padding: 8,
                                  textAlign: 'right',
                                  fontSize: 14,
                                  color: '#6b7280',
                                }}
                              >
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => (
                              <tr key={index}>
                                <td
                                  style={{
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e5e7eb',
                                  }}
                                >
                                  <div style={{ fontWeight: 500 }}>
                                    {item.name}
                                  </div>
                                  <div
                                    style={{ fontSize: 14, color: '#6b7280' }}
                                  >
                                    {item.variant}
                                  </div>
                                </td>
                                <td
                                  style={{
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e5e7eb',
                                    textAlign: 'center',
                                  }}
                                >
                                  {item.quantity}
                                </td>
                                <td
                                  style={{
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e5e7eb',
                                    textAlign: 'right',
                                  }}
                                >
                                  {formatPrice(item.totalPence)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td
                                colSpan={2}
                                style={{
                                  padding: '8px 0',
                                  textAlign: 'right',
                                  color: '#6b7280',
                                }}
                              >
                                Subtotal
                              </td>
                              <td
                                style={{
                                  padding: '8px 0',
                                  textAlign: 'right',
                                  color: '#111827',
                                }}
                              >
                                {formatPrice(subtotalPence)}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={2}
                                style={{
                                  padding: '8px 0',
                                  textAlign: 'right',
                                  color: '#6b7280',
                                }}
                              >
                                Shipping
                              </td>
                              <td
                                style={{
                                  padding: '8px 0',
                                  textAlign: 'right',
                                  color: '#111827',
                                }}
                              >
                                {shippingPence === 0
                                  ? 'Free'
                                  : formatPrice(shippingPence)}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={2}
                                style={{
                                  padding: '12px 0',
                                  textAlign: 'right',
                                  fontWeight: 600,
                                  color: '#111827',
                                  fontSize: 18,
                                }}
                              >
                                Total
                              </td>
                              <td
                                style={{
                                  padding: '12px 0',
                                  textAlign: 'right',
                                  fontWeight: 600,
                                  color: '#111827',
                                  fontSize: 18,
                                }}
                              >
                                {formatPrice(totalPence)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>

                        {/* Shipping Address */}
                        <h3
                          style={{
                            margin: '0 0 12px 0',
                            color: '#111827',
                            fontSize: 16,
                          }}
                        >
                          Shipping Address
                        </h3>
                        <div
                          style={{
                            color: '#4b5563',
                            marginBottom: 24,
                            lineHeight: 1.5,
                          }}
                        >
                          {shippingAddress.line1}
                          <br />
                          {shippingAddress.line2 && (
                            <>
                              {shippingAddress.line2}
                              <br />
                            </>
                          )}
                          {shippingAddress.city}
                          <br />
                          {shippingAddress.postcode}
                          <br />
                          {shippingAddress.country}
                        </div>

                        {/* CTA Button */}
                        <div style={{ textAlign: 'center', margin: '32px 0' }}>
                          <a
                            href={trackingUrl}
                            style={{
                              display: 'inline-block',
                              padding: '14px 32px',
                              backgroundColor: '#0ea5e9',
                              color: '#ffffff',
                              textDecoration: 'none',
                              borderRadius: 8,
                              fontWeight: 600,
                            }}
                          >
                            Track Your Order
                          </a>
                        </div>

                        {/* What's Next */}
                        <div
                          style={{
                            backgroundColor: '#f0f9ff',
                            borderRadius: 8,
                            padding: 20,
                          }}
                        >
                          <h3
                            style={{
                              margin: '0 0 12px 0',
                              color: '#0369a1',
                              fontSize: 16,
                            }}
                          >
                            What happens next?
                          </h3>
                          <ul
                            style={{
                              margin: 0,
                              padding: '0 0 0 20px',
                              color: '#4b5563',
                              lineHeight: 1.6,
                            }}
                          >
                            <li>
                              Your custom items will be printed within 1-2
                              working days
                            </li>
                            <li>
                              You&apos;ll receive a shipping notification with
                              tracking details
                            </li>
                            <li>Estimated delivery: 3-5 working days</li>
                          </ul>
                        </div>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          padding: 24,
                          backgroundColor: '#f9fafb',
                          borderTop: '1px solid #e5e7eb',
                          textAlign: 'center',
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 8px 0',
                            color: '#6b7280',
                            fontSize: 14,
                          }}
                        >
                          Need help? Contact us at{' '}
                          <a
                            href="mailto:support@aiprintly.co.uk"
                            style={{ color: '#0ea5e9' }}
                          >
                            support@aiprintly.co.uk
                          </a>
                        </p>
                        <p
                          style={{ margin: 0, color: '#9ca3af', fontSize: 12 }}
                        >
                          AIPrintly - Custom AI-Generated Print Products
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export default OrderConfirmationEmail
