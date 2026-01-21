/**
 * Create via Upload Route
 *
 * Allows users to upload an image and then proceed to the product builder.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import type { MetaFunction } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  UploadDropzone,
  type UploadedAsset,
} from '~/components/upload/UploadDropzone'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

export const meta: MetaFunction = () => {
  return [
    { title: 'Upload Your Image - AIPrintly' },
    {
      name: 'description',
      content:
        'Upload your own image to create custom print products like mugs, t-shirts, and art prints.',
    },
  ]
}

/**
 * Product type options for after upload
 */
const PRODUCT_TYPES = [
  {
    id: 'mug',
    name: 'Mug',
    description: 'Custom ceramic mugs',
    icon: '☕',
  },
  {
    id: 'apparel',
    name: 'Apparel',
    description: 'T-shirts and hoodies',
    icon: '👕',
  },
  {
    id: 'print',
    name: 'Art Print',
    description: 'Posters and framed prints',
    icon: '🖼️',
  },
]

export default function CreateUploadPage() {
  const navigate = useNavigate()
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | null>(null)
  const [selectedProductType, setSelectedProductType] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const handleUploadComplete = (asset: UploadedAsset) => {
    setUploadedAsset(asset)
    setError(null)
  }

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage)
    setUploadedAsset(null)
  }

  const handleContinue = () => {
    if (!uploadedAsset || !selectedProductType) return
    navigate(`/build/${selectedProductType}?assetId=${uploadedAsset.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/create"
          className="mb-8 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Create
        </Link>

        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Upload Your Image
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Upload a photo or design to turn into a custom product
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Step 1: Upload Image</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadDropzone
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
              maxSizeMB={25}
            />

            {/* Upload Preview */}
            {uploadedAsset && (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950" data-testid="upload-success">
                <div className="flex items-start gap-4">
                  <img
                    src={uploadedAsset.storageUrl}
                    alt="Uploaded preview"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Image uploaded successfully!
                    </p>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                      {uploadedAsset.width} x {uploadedAsset.height} pixels
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Type Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Step 2: Choose Product Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {PRODUCT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedProductType(type.id)}
                  disabled={!uploadedAsset}
                  data-testid={`product-${type.id}`}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    selectedProductType === type.id
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  } ${!uploadedAsset ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="text-3xl">{type.icon}</div>
                  <h3 className="mt-2 font-medium text-gray-900 dark:text-white">
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>

            {!uploadedAsset && (
              <p className="mt-4 text-center text-sm text-gray-500">
                Upload an image first to select a product type
              </p>
            )}
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link to="/create/generate">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI instead
            </Link>
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!uploadedAsset || !selectedProductType}
            size="lg"
          >
            Continue to Builder
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
