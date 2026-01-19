/**
 * ShippingForm Component
 *
 * UK address form for checkout with validation.
 */

import { useState } from 'react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { cn, isValidUKPostcode, formatUKPostcode } from '~/lib/utils'

export interface ShippingAddress {
  fullName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
  country: string
}

export interface ShippingFormProps {
  /** Initial address values */
  initialValues?: Partial<ShippingAddress>
  /** Callback when form is submitted with valid data */
  onSubmit: (address: ShippingAddress) => void
  /** Whether form is submitting */
  isSubmitting?: boolean
  /** Additional class name */
  className?: string
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  addressLine1?: string
  city?: string
  postcode?: string
}

const defaultAddress: ShippingAddress = {
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postcode: '',
  country: 'United Kingdom',
}

export function ShippingForm({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  className,
}: ShippingFormProps) {
  const [values, setValues] = useState<ShippingAddress>({
    ...defaultAddress,
    ...initialValues,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (name: keyof ShippingAddress, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        break
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email'
        break
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!/^[\d\s\+\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
          return 'Please enter a valid phone number'
        }
        break
      case 'addressLine1':
        if (!value.trim()) return 'Address is required'
        break
      case 'city':
        if (!value.trim()) return 'City is required'
        break
      case 'postcode':
        if (!value.trim()) return 'Postcode is required'
        if (!isValidUKPostcode(value)) return 'Please enter a valid UK postcode'
        break
    }
    return undefined
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Format postcode on blur
    if (name === 'postcode' && value) {
      setValues((prev) => ({ ...prev, postcode: formatUKPostcode(value) }))
    }

    // Validate on blur
    const error = validateField(name as keyof ShippingAddress, value)
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const requiredFields: (keyof ShippingAddress)[] = [
      'fullName',
      'email',
      'phone',
      'addressLine1',
      'city',
      'postcode',
    ]

    for (const field of requiredFields) {
      const error = validateField(field, values[field])
      if (error) {
        newErrors[field as keyof FormErrors] = error
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      addressLine1: true,
      city: true,
      postcode: true,
    })

    if (validateForm()) {
      onSubmit({
        ...values,
        postcode: formatUKPostcode(values.postcode),
      })
    }
  }

  const getFieldError = (name: keyof FormErrors): string | undefined => {
    return touched[name] ? errors[name] : undefined
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      data-testid="shipping-form"
      noValidate
    >
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Contact Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={values.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!getFieldError('fullName')}
              disabled={isSubmitting}
              aria-describedby={getFieldError('fullName') ? 'fullName-error' : undefined}
            />
            {getFieldError('fullName') && (
              <p id="fullName-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldError('fullName')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!getFieldError('email')}
              disabled={isSubmitting}
              aria-describedby={getFieldError('email') ? 'email-error' : undefined}
            />
            {getFieldError('email') && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldError('email')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!getFieldError('phone')}
              disabled={isSubmitting}
              aria-describedby={getFieldError('phone') ? 'phone-error' : undefined}
            />
            {getFieldError('phone') && (
              <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldError('phone')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Shipping Address
        </h3>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              type="text"
              autoComplete="address-line1"
              placeholder="House number and street name"
              value={values.addressLine1}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!getFieldError('addressLine1')}
              disabled={isSubmitting}
              aria-describedby={getFieldError('addressLine1') ? 'addressLine1-error' : undefined}
            />
            {getFieldError('addressLine1') && (
              <p id="addressLine1-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldError('addressLine1')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              type="text"
              autoComplete="address-line2"
              placeholder="Flat, apartment, building, etc."
              value={values.addressLine2}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                value={values.city}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!getFieldError('city')}
                disabled={isSubmitting}
                aria-describedby={getFieldError('city') ? 'city-error' : undefined}
              />
              {getFieldError('city') && (
                <p id="city-error" className="mt-1 text-sm text-red-600" role="alert">
                  {getFieldError('city')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="county">County (Optional)</Label>
              <Input
                id="county"
                name="county"
                type="text"
                autoComplete="address-level1"
                value={values.county}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                name="postcode"
                type="text"
                autoComplete="postal-code"
                placeholder="e.g., SW1A 1AA"
                value={values.postcode}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!getFieldError('postcode')}
                disabled={isSubmitting}
                className="uppercase"
                aria-describedby={getFieldError('postcode') ? 'postcode-error' : undefined}
              />
              {getFieldError('postcode') && (
                <p id="postcode-error" className="mt-1 text-sm text-red-600" role="alert">
                  {getFieldError('postcode')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                type="text"
                value={values.country}
                disabled
                className="bg-gray-50 dark:bg-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Currently shipping to UK only
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        data-testid="shipping-submit"
      >
        {isSubmitting ? 'Processing...' : 'Continue to Payment'}
      </Button>
    </form>
  )
}
