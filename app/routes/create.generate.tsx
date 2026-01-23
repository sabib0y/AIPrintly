/**
 * Create via AI Generation Route
 *
 * Allows users to generate an AI image and then proceed to the product builder.
 */

import { useState } from 'react'
import { useNavigate, Link, useLoaderData } from 'react-router'
import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { data } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ImageGenerator,
  type GeneratedAsset,
} from '~/components/generate/ImageGenerator'
import { getSession, commitSession } from '~/services/session.server'
import { getBalance } from '~/services/credits.server'
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react'

export const meta: MetaFunction = () => {
  return [
    { title: 'Generate with AI - AIPrintly' },
    {
      name: 'description',
      content:
        'Use AI to generate unique images for your custom print products.',
    },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')
  const userId = session.get('userId')

  let credits = 0
  if (sessionId) {
    try {
      credits = await getBalance(sessionId, userId ?? null)
    } catch {
      credits = 0
    }
  }

  return data(
    { credits },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    }
  )
}

/**
 * Product type options for after generation
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

export default function CreateGeneratePage() {
  const { credits } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(
    null
  )
  const [selectedProductType, setSelectedProductType] = useState<string | null>(
    null
  )

  const handleGenerate = (asset: GeneratedAsset) => {
    setGeneratedAsset(asset)
  }

  const handleContinue = () => {
    if (!generatedAsset || !selectedProductType) return
    navigate(`/build/${selectedProductType}?assetId=${generatedAsset.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
            Generate with AI
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Describe your idea and let AI create a unique design
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Generator Section */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Generate Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageGenerator
                onGenerate={handleGenerate}
                initialCredits={credits}
                showDimensionPicker
              />
            </CardContent>
          </Card>

          {/* Product Selection Section */}
          <div className="space-y-6">
            {/* Generated Preview */}
            {generatedAsset && (
              <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800 dark:text-green-200">
                    Generated Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={generatedAsset.storageUrl}
                    alt="Generated preview"
                    className="w-full rounded-lg"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                  <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                    {generatedAsset.width} x {generatedAsset.height} pixels
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Product Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Choose Product Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PRODUCT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedProductType(type.id)}
                      disabled={!generatedAsset}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                        selectedProductType === type.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      } ${!generatedAsset ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{type.icon}</div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {type.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {!generatedAsset && (
                  <p className="mt-4 text-center text-sm text-gray-500">
                    Generate an image first to select a product type
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleContinue}
                disabled={!generatedAsset || !selectedProductType}
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Continue to Builder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link to="/create/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload your own image instead
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
