/**
 * Shipping Notification Email Template
 *
 * React Email template for shipping notification emails.
 * Can be used with React Email library or as a reference.
 */

import * as React from 'react'

export interface ShippingNotificationEmailProps {
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

export function ShippingNotificationEmail({
  orderNumber,
  customerName,
  trackingNumber,
  carrierTrackingUrl,
  carrierName,
  orderTrackingUrl,
  shippingAddress,
}: ShippingNotificationEmailProps) {
  const firstName = customerName.split(' ')[0]

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your Order is On Its Way</title>
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
                        {/* Package Icon */}
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                          <div
                            style={{
                              display: 'inline-block',
                              width: 64,
                              height: 64,
                              backgroundColor: '#dbeafe',
                              borderRadius: '50%',
                              lineHeight: '64px',
                              fontSize: 32,
                            }}
                          >
                            📦
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
                          Your Order is On Its Way!
                        </h2>

                        <p
                          style={{
                            margin: '0 0 24px 0',
                            color: '#4b5563',
                            textAlign: 'center',
                          }}
                        >
                          Great news, {firstName}!
                          <br />
                          Your order has been shipped and is on its way to you.
                        </p>

                        {/* Tracking Details Box */}
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
                                      fontSize: 16,
                                      fontWeight: 600,
                                      color: '#111827',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {orderNumber}
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td style={{ paddingTop: 16 }}>
                                  <div
                                    style={{ fontSize: 14, color: '#6b7280' }}
                                  >
                                    Tracking Number
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 16,
                                      fontWeight: 600,
                                      color: '#111827',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {trackingNumber}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      color: '#6b7280',
                                      marginTop: 4,
                                    }}
                                  >
                                    via {carrierName}
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* CTA Button */}
                        <div style={{ textAlign: 'center', margin: '32px 0' }}>
                          <a
                            href={carrierTrackingUrl}
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
                            Track Your Package
                          </a>
                        </div>

                        {/* Shipping Address */}
                        <h3
                          style={{
                            margin: '0 0 12px 0',
                            color: '#111827',
                            fontSize: 16,
                          }}
                        >
                          Delivering To
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

                        {/* What to Expect */}
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
                            What to expect
                          </h3>
                          <ul
                            style={{
                              margin: 0,
                              padding: '0 0 0 20px',
                              color: '#4b5563',
                              lineHeight: 1.6,
                            }}
                          >
                            <li>Estimated delivery: 3-5 working days</li>
                            <li>
                              You may receive a text or email from the carrier
                            </li>
                            <li>Someone may need to sign for the package</li>
                          </ul>
                        </div>

                        {/* View Order Link */}
                        <div
                          style={{ textAlign: 'center', marginTop: 24 }}
                        >
                          <a
                            href={orderTrackingUrl}
                            style={{ color: '#0ea5e9', fontSize: 14 }}
                          >
                            View Order Details
                          </a>
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

export default ShippingNotificationEmail
