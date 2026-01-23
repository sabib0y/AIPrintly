/**
 * PhotoConsentForm Component
 *
 * GDPR-compliant consent form for photo uploads.
 * Ensures users confirm:
 * 1. They have the right to use the image
 * 2. If photo contains a child, they are the parent/guardian
 *
 * Must be shown BEFORE upload processing begins.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Camera, Info, ShieldCheck } from 'lucide-react'
import { cn } from '~/lib/utils'

export interface ConsentData {
  rightsToUse: boolean
  childGuardianConsent: boolean
  timestamp: string
}

export interface PhotoConsentFormProps {
  /** Callback when consent is given */
  onConsent: (consent: ConsentData) => void
  /** Callback when user cancels */
  onCancel?: () => void
  /** Additional CSS class names */
  className?: string
}

/**
 * PhotoConsentForm - GDPR-compliant consent UI for photo uploads
 */
export function PhotoConsentForm({
  onConsent,
  onCancel,
  className,
}: PhotoConsentFormProps) {
  const [rightsToUse, setRightsToUse] = useState(false)
  const [childGuardianConsent, setChildGuardianConsent] = useState(false)

  const canProceed = rightsToUse && childGuardianConsent

  const handleConsent = () => {
    if (!canProceed) return

    onConsent({
      rightsToUse,
      childGuardianConsent,
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <Card className={cn('border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          Photo Upload Consent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consent Checkboxes */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Before uploading, please confirm:
          </p>

          {/* Rights to Use Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="rights-to-use"
              checked={rightsToUse}
              onCheckedChange={(checked: boolean) => setRightsToUse(checked === true)}
              aria-required="true"
              className="mt-0.5"
            />
            <Label
              htmlFor="rights-to-use"
              className="cursor-pointer text-sm leading-relaxed text-gray-900 dark:text-gray-100"
            >
              I have the right to use this image
            </Label>
          </div>

          {/* Child Guardian Consent Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="child-guardian-consent"
              checked={childGuardianConsent}
              onCheckedChange={(checked: boolean) =>
                setChildGuardianConsent(checked === true)
              }
              aria-required="true"
              className="mt-0.5"
            />
            <Label
              htmlFor="child-guardian-consent"
              className="cursor-pointer text-sm leading-relaxed text-gray-900 dark:text-gray-100"
            >
              If this photo contains a child, I am their parent or legal
              guardian and consent to its use for product creation
            </Label>
          </div>
        </div>

        {/* Information Section */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Your photo will be:
            </p>
          </div>
          <ul className="ml-6 list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Used only to create your product</li>
            <li>Automatically deleted after 30 days</li>
            <li>Never used for AI training</li>
          </ul>
        </div>

        {/* Privacy Policy Link */}
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-gray-500" />
          <a
            href="/privacy#children-data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 underline-offset-4 hover:underline dark:text-sky-400"
          >
            Read our Privacy Policy
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            onClick={handleConsent}
            disabled={!canProceed}
            className="order-1 sm:order-2"
            size="lg"
          >
            I Consent & Continue
          </Button>
        </div>

        {/* Validation Message */}
        {!canProceed && (rightsToUse || childGuardianConsent) && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400" role="alert">
            Please confirm both statements to continue
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default PhotoConsentForm
