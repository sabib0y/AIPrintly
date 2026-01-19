/**
 * Product Builder Page
 *
 * Main page for customising products with user designs.
 * Supports mug, apparel, print, and storybook product types.
 */

import { useState, useCallback } from 'react';
import { Link, useParams, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Canvas } from '~/components/builder/Canvas';
import { TransformControls } from '~/components/builder/TransformControls';
import { SizeSelector, type SizeOption } from '~/components/builder/SizeSelector';
import { ColourSelector, type ColourOption } from '~/components/builder/ColourSelector';
import { PriceDisplay } from '~/components/builder/PriceDisplay';
import { StockStatus } from '~/components/builder/StockStatus';
import { MockupPreview } from '~/components/builder/MockupPreview';
import { QualityWarning, QualityBadge } from '~/components/builder/QualityWarning';
import {
  PRINT_AREAS,
  type DesignElement,
  type PrintArea,
  type Transform,
  type QualityAssessment,
  assessQuality,
} from '~/components/builder/types';
import {
  getProductsByCategory,
  getProductVariants,
  type ProductWithVariants,
} from '~/services/products.server';

/**
 * Meta function for dynamic page titles
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const productType = data?.productType ?? 'Product';
  const displayName = productType.charAt(0).toUpperCase() + productType.slice(1);

  return [
    { title: `Build Your ${displayName} - AIPrintly` },
    {
      name: 'description',
      content: `Customise your ${displayName.toLowerCase()} with AI-generated or uploaded designs. Easy-to-use builder with instant preview.`,
    },
  ];
};

/**
 * Product type to category mapping
 */
const PRODUCT_TYPE_MAP: Record<string, string> = {
  mug: 'MUG',
  apparel: 'APPAREL',
  print: 'PRINT',
  storybook: 'STORYBOOK',
};

/**
 * Loader to fetch products for the builder
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { productType } = params;

  if (!productType || !PRODUCT_TYPE_MAP[productType]) {
    return {
      productType: null,
      products: [],
      printArea: null,
      error: 'Invalid product type',
    };
  }

  const category = PRODUCT_TYPE_MAP[productType];
  const result = await getProductsByCategory(category, {
    includeVariants: true,
    pageSize: 50,
  });

  const printArea = PRINT_AREAS[productType] ?? PRINT_AREAS.mug;

  return {
    productType,
    products: result.products as ProductWithVariants[],
    printArea,
    error: null,
  };
}

export default function BuilderPage() {
  const { productType, products, printArea, error } = useLoaderData<typeof loader>();

  // State for selected product and variant
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    products[0]?.id ?? null
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // State for design elements
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // State for mockup
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);

  // State for quality
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);

  // Get selected product and variant
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  // Get selected element
  const selectedElement = elements.find((e) => e.id === selectedElementId);

  // Build size and colour options from variants
  const sizeOptions: SizeOption[] = (() => {
    if (!selectedProduct?.variants) return [];
    const sizes = new Map<string, SizeOption>();

    selectedProduct.variants.forEach((v) => {
      if (v.size && !sizes.has(v.size)) {
        sizes.set(v.size, {
          value: v.size,
          label: v.size,
          pricePence: v.sellingPricePence,
          stockStatus: v.stockStatus,
          isAvailable: v.stockStatus !== 'OUT_OF_STOCK',
        });
      }
    });

    return Array.from(sizes.values());
  })();

  const colourOptions: ColourOption[] = (() => {
    if (!selectedProduct?.variants) return [];
    const colours = new Map<string, ColourOption>();

    selectedProduct.variants.forEach((v) => {
      if (v.colour && !colours.has(v.colour)) {
        colours.set(v.colour, {
          name: v.colour,
          hex: v.colourHex,
          stockStatus: v.stockStatus,
          isAvailable: v.stockStatus !== 'OUT_OF_STOCK',
        });
      }
    });

    return Array.from(colours.values());
  })();

  // Handle element update
  const handleElementUpdate = useCallback((element: DesignElement) => {
    setElements((prev) =>
      prev.map((e) => (e.id === element.id ? element : e))
    );

    // Update quality assessment
    if (printArea) {
      const assessment = assessQuality(element, printArea as PrintArea);
      setQualityAssessment(assessment);
    }
  }, [printArea]);

  // Handle element selection
  const handleElementSelect = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
    setElements((prev) =>
      prev.map((e) => ({
        ...e,
        isSelected: e.id === elementId,
      }))
    );
  }, []);

  // Handle element delete
  const handleElementDelete = useCallback((elementId: string) => {
    setElements((prev) => prev.filter((e) => e.id !== elementId));
    setSelectedElementId(null);
    setQualityAssessment(null);
  }, []);

  // Handle image drop
  const handleImageDrop = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;

      // Create image to get dimensions
      const img = new Image();
      img.onload = () => {
        const newElement: DesignElement = {
          id: `elem-${Date.now()}`,
          imageUrl,
          imageWidth: img.width,
          imageHeight: img.height,
          transform: {
            position: {
              x: printArea ? (printArea as PrintArea).width / 2 : 450,
              y: printArea ? (printArea as PrintArea).height / 2 : 190,
            },
            scale: 1,
            rotation: 0,
          },
          isSelected: true,
        };

        setElements((prev) => [
          ...prev.map((e) => ({ ...e, isSelected: false })),
          newElement,
        ]);
        setSelectedElementId(newElement.id);

        // Calculate quality
        if (printArea) {
          const assessment = assessQuality(newElement, printArea as PrintArea);
          setQualityAssessment(assessment);
        }
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }, [printArea]);

  // Handle transform change from controls
  const handleTransformChange = useCallback((transform: Transform) => {
    if (selectedElement) {
      handleElementUpdate({
        ...selectedElement,
        transform,
      });
    }
  }, [selectedElement, handleElementUpdate]);

  // Handle size selection
  const handleSizeChange = (size: string) => {
    if (!selectedProduct) return;

    // Find variant with this size and current colour (if any)
    const currentColour = selectedVariant?.colour;
    const variant = selectedProduct.variants.find(
      (v) =>
        v.size === size &&
        (currentColour ? v.colour === currentColour : true) &&
        v.stockStatus !== 'OUT_OF_STOCK'
    );

    if (variant) {
      setSelectedVariantId(variant.id);
    }
  };

  // Handle colour selection
  const handleColourChange = (colour: string) => {
    if (!selectedProduct) return;

    // Find variant with this colour and current size (if any)
    const currentSize = selectedVariant?.size;
    const variant = selectedProduct.variants.find(
      (v) =>
        v.colour === colour &&
        (currentSize ? v.size === currentSize : true) &&
        v.stockStatus !== 'OUT_OF_STOCK'
    );

    if (variant) {
      setSelectedVariantId(variant.id);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    // TODO: Implement add to cart
    console.log('Add to cart', {
      productId: selectedProductId,
      variantId: selectedVariantId,
      elements,
    });
  };

  // Show error state
  if (error || !productType || !printArea) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Type Not Found
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please select a valid product type to customise.
          </p>
          <Button asChild className="mt-6">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayType = productType.charAt(0).toUpperCase() + productType.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Build Your {displayType}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Upload or generate an image and customise your design
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/create">
                Generate AI Image
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Canvas Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Design Canvas</CardTitle>
                  {qualityAssessment && (
                    <QualityBadge assessment={qualityAssessment} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Canvas
                  productType={productType}
                  printArea={printArea as PrintArea}
                  elements={elements}
                  onElementUpdate={handleElementUpdate}
                  onElementSelect={handleElementSelect}
                  onElementDelete={handleElementDelete}
                  onImageDrop={handleImageDrop}
                  showZoomControls
                  showDimensions
                  showBleedMargin
                />

                {/* Quality Warning */}
                {qualityAssessment && !qualityAssessment.isAcceptable && (
                  <QualityWarning
                    assessment={qualityAssessment}
                    minRequiredDpi={(printArea as PrintArea).minDpi}
                    onAdjustDesign={() => {
                      if (selectedElement) {
                        handleElementSelect(selectedElement.id);
                      }
                    }}
                    className="mt-4"
                  />
                )}

                {/* Transform Controls */}
                {selectedElement && (
                  <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                    <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                      Transform Controls
                    </h3>
                    <TransformControls
                      transform={selectedElement.transform}
                      onTransformChange={handleTransformChange}
                      showPosition
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Product Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Size Selector */}
                {sizeOptions.length > 0 && (
                  <SizeSelector
                    sizes={sizeOptions}
                    selectedSize={selectedVariant?.size ?? null}
                    onSizeChange={handleSizeChange}
                    showPrices
                    showStock
                  />
                )}

                {/* Colour Selector */}
                {colourOptions.length > 0 && (
                  <ColourSelector
                    colours={colourOptions}
                    selectedColour={selectedVariant?.colour ?? null}
                    onColourChange={handleColourChange}
                    showNames
                  />
                )}

                {/* Stock Status */}
                {selectedVariant && (
                  <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                    <StockStatus
                      status={selectedVariant.stockStatus}
                      variant="inline"
                      showIcon
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview & Price */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MockupPreview
                  mockupUrl={mockupUrl}
                  isLoading={isGeneratingMockup}
                  productName={selectedProduct?.name ?? displayType}
                  allowZoom
                />

                {/* Price Display */}
                {selectedVariant && (
                  <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                    <PriceDisplay
                      pricePence={selectedVariant.sellingPricePence}
                      size="lg"
                    />
                  </div>
                )}

                {/* Add to Cart */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                  disabled={
                    elements.length === 0 ||
                    !selectedVariant ||
                    selectedVariant.stockStatus === 'OUT_OF_STOCK' ||
                    (qualityAssessment !== null && !qualityAssessment.isAcceptable)
                  }
                >
                  Add to Basket
                </Button>

                {elements.length === 0 && (
                  <p className="text-center text-sm text-gray-500">
                    Add a design to continue
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardContent className="py-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Need Help?
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Drag and drop to position your design</li>
                  <li>Use slider or scroll to resize</li>
                  <li>Press R to rotate by 15 degrees</li>
                  <li>Press Delete to remove design</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
