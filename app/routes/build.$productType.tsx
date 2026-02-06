/**
 * Product Builder Page
 *
 * Main page for customising products with user designs.
 * Supports mug, apparel, print, and storybook product types.
 */

import { useState, useCallback, useEffect } from 'react';
import { Link, useParams, useLoaderData, useSearchParams, useNavigate } from 'react-router';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect } from 'react-router';
import { Button } from '~/components/ui/button';
import { MVP_PRODUCT_TYPES } from '~/lib/categories';
import { Spinner } from '~/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { prisma } from '~/services/prisma.server';
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
import type { ProductWithVariants } from '~/lib/product-types';

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
 * Asset data from loader
 */
interface LoaderAsset {
  id: string;
  storageUrl: string;
  width: number;
  height: number;
}

/**
 * Loader to fetch products and optional asset for the builder
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { productType } = params;
  const url = new URL(request.url);
  const assetId = url.searchParams.get('assetId');

  if (!productType || !PRODUCT_TYPE_MAP[productType]) {
    return data({
      productType: null,
      products: [],
      printArea: null,
      asset: null,
      error: 'Invalid product type',
    });
  }

  // MVP scope: Redirect non-MVP product types (mug, apparel) to products page
  if (!MVP_PRODUCT_TYPES.includes(productType)) {
    throw redirect('/products');
  }

  // Dynamic import to avoid server-only module being bundled for client
  const { getProductsByCategory } = await import('~/services/products.server');

  const category = PRODUCT_TYPE_MAP[productType];
  const result = await getProductsByCategory(category, {
    includeVariants: true,
    pageSize: 50,
  });

  const printArea = PRINT_AREAS[productType] ?? PRINT_AREAS.mug;

  // Fetch asset if assetId provided
  let asset: LoaderAsset | null = null;
  if (assetId) {
    try {
      const foundAsset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          storageUrl: true,
          width: true,
          height: true,
        },
      });
      if (foundAsset) {
        asset = foundAsset;
      }
    } catch (err) {
      console.error('Failed to fetch asset:', err);
    }
  }

  return data({
    productType,
    products: result.products as ProductWithVariants[],
    printArea,
    asset,
    error: null,
  });
}

export default function BuilderPage() {
  const { productType, products, printArea, asset, error } = useLoaderData<typeof loader>();

  // State for selected product and variant
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    products[0]?.id ?? null
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // State for design elements
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Track if we've loaded the initial asset
  const [initialAssetLoaded, setInitialAssetLoaded] = useState(false);

  // State for mockup
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);

  // State for quality
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);

  // State for current asset ID (for add to cart)
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(asset?.id ?? null);

  // Load asset from URL params on mount
  useEffect(() => {
    if (asset && !initialAssetLoaded && printArea) {
      const newElement: DesignElement = {
        id: `elem-${Date.now()}`,
        imageUrl: asset.storageUrl,
        imageWidth: asset.width,
        imageHeight: asset.height,
        transform: {
          position: {
            x: (printArea as PrintArea).width / 2,
            y: (printArea as PrintArea).height / 2,
          },
          scale: 1,
          rotation: 0,
        },
        isSelected: true,
      };

      setElements([newElement]);
      setSelectedElementId(newElement.id);
      setCurrentAssetId(asset.id);
      setInitialAssetLoaded(true);

      // Calculate initial quality
      const assessment = assessQuality(newElement, printArea as PrintArea);
      setQualityAssessment(assessment);
    }
  }, [asset, initialAssetLoaded, printArea]);

  // Get selected product and variant
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  // Auto-select first available variant when product changes and no variant is selected
  useEffect(() => {
    if (selectedProduct && !selectedVariantId) {
      const firstAvailableVariant = selectedProduct.variants.find(
        (v) => v.stockStatus !== 'OUT_OF_STOCK'
      );
      if (firstAvailableVariant) {
        setSelectedVariantId(firstAvailableVariant.id);
      }
    }
  }, [selectedProduct, selectedVariantId]);

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

  // State for add to cart
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [showQualityWarningDialog, setShowQualityWarningDialog] = useState(false);
  const navigate = useNavigate();

  // Check if quality has warnings (but not blocking errors)
  const hasQualityWarnings = qualityAssessment !== null && (
    !qualityAssessment.isDpiAcceptable ||
    !qualityAssessment.isWithinBounds ||
    qualityAssessment.warnings.length > 0
  );

  // Handle add to cart button click
  const handleAddToCartClick = () => {
    if (!selectedProductId || !selectedVariantId || !currentAssetId || elements.length === 0) {
      setAddToCartError('Please complete your design before adding to basket');
      return;
    }

    // Show warning dialog if there are quality warnings
    if (hasQualityWarnings) {
      setShowQualityWarningDialog(true);
      return;
    }

    // Otherwise proceed directly
    handleAddToCart();
  };

  // Handle add to cart (actual submission)
  const handleAddToCart = async () => {
    if (!selectedProductId || !selectedVariantId || !currentAssetId || elements.length === 0) {
      setAddToCartError('Please complete your design before adding to basket');
      return;
    }

    const element = elements[0];
    if (!element) return;

    setIsAddingToCart(true);
    setAddToCartError(null);
    setShowQualityWarningDialog(false);

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProductId,
          variantId: selectedVariantId,
          assetId: currentAssetId,
          customisation: {
            position: element.transform.position,
            scale: element.transform.scale,
            rotation: element.transform.rotation,
          },
          mockupUrl: mockupUrl ?? undefined,
          quantity: 1,
          qualityWarnings: qualityAssessment?.warnings ?? [],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAddToCartError(data.error || 'Failed to add to basket');
        return;
      }

      // Success - navigate to cart
      navigate('/cart');
    } catch (error) {
      console.error('Add to cart error:', error);
      setAddToCartError('Something went wrong. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
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
                  data-testid="builder-canvas"
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
                    <h2 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                      Transform Controls
                    </h2>
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
                  onClick={handleAddToCartClick}
                  className="w-full"
                  size="lg"
                  disabled={
                    isAddingToCart ||
                    elements.length === 0 ||
                    !selectedVariant ||
                    !currentAssetId ||
                    selectedVariant.stockStatus === 'OUT_OF_STOCK'
                  }
                  data-testid="add-to-cart-button"
                >
                  {isAddingToCart ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Adding to Basket...
                    </>
                  ) : hasQualityWarnings ? (
                    'Add to Basket (with warnings)'
                  ) : (
                    'Add to Basket'
                  )}
                </Button>

                {/* Error message */}
                {addToCartError && (
                  <p className="text-center text-sm text-red-600">
                    {addToCartError}
                  </p>
                )}

                {elements.length === 0 && (
                  <p className="text-center text-sm text-gray-500">
                    Add a design to continue
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Help Section - Device-aware instructions */}
            <Card>
              <CardContent className="py-4">
                <h2 className="font-medium text-gray-900 dark:text-white">
                  Need Help?
                </h2>
                {/* Desktop instructions (hidden on touch devices) */}
                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 hidden md:block">
                  <li>Drag and drop to position your design</li>
                  <li>Use slider or scroll to resize</li>
                  <li>Press R to rotate by 15 degrees</li>
                  <li>Press Delete to remove design</li>
                </ul>
                {/* Mobile/touch instructions (visible on small screens) */}
                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 md:hidden">
                  <li>Drag with one finger to move your design</li>
                  <li>Pinch with two fingers to resize</li>
                  <li>Twist with two fingers to rotate</li>
                  <li>Tap outside the design to deselect</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quality Warning Confirmation Dialog */}
      <AlertDialog open={showQualityWarningDialog} onOpenChange={setShowQualityWarningDialog}>
        <AlertDialogContent data-testid="quality-confirm-dialog" aria-labelledby="quality-dialog-title" aria-describedby="quality-dialog-description">
          <AlertDialogHeader>
            <AlertDialogTitle id="quality-dialog-title">Quality Warning</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div id="quality-dialog-description" className="space-y-3">
                <p>
                  Your design has the following quality issues that may affect print results:
                </p>
                {qualityAssessment && qualityAssessment.warnings.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-amber-600 dark:text-amber-400">
                    {qualityAssessment.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                )}
                <p className="font-medium">
                  Do you want to proceed anyway?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Adjust Design</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddToCart} data-testid="confirm-quality-warning">
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
