/**
 * Storybook Builder Page
 *
 * Main page for creating personalised storybooks.
 * Supports page management, text editing, illustrations, and preview.
 */

import { useState, useCallback, useEffect } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router';
import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { PageThumbnailStrip, type StoryPage } from '~/components/storybook/PageThumbnailStrip';
import { PageEditor, type PageData, type PageLayout } from '~/components/storybook/PageEditor';
import { BookPreview, type PreviewPage } from '~/components/storybook/BookPreview';
import { cn } from '~/lib/utils';

/**
 * Meta function for page SEO
 */
export const meta: MetaFunction = () => {
  return [
    { title: 'Create Your Storybook - AIPrintly' },
    {
      name: 'description',
      content:
        'Create personalised storybooks with AI-generated illustrations. Design unique stories for children with our easy-to-use builder.',
    },
  ];
};

/**
 * Storybook page data structure for the builder
 */
interface StorybookPage {
  id: string;
  pageNumber: number;
  type: 'cover' | 'content' | 'back';
  layout: PageLayout;
  text: string;
  illustrationUrl?: string;
  illustrationPrompt?: string;
  fontSize: number;
  textAlignment: 'left' | 'centre' | 'right';
}

/**
 * Loader to initialise storybook builder
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('project');

  // TODO: Load existing project if projectId is provided
  // For now, return empty state to initialise new storybook

  return {
    projectId,
    title: 'Untitled Storybook',
    childName: '',
    pages: [] as StorybookPage[],
  };
}

/**
 * Action to save storybook changes
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case 'save':
      // TODO: Save storybook to database
      return { success: true };

    case 'generate-illustration':
      // TODO: Generate AI illustration
      const prompt = formData.get('prompt');
      return { illustrationUrl: null, error: 'Not implemented' };

    default:
      return { error: 'Invalid action' };
  }
}

/**
 * Default initial pages for a new storybook
 */
function createInitialPages(): StorybookPage[] {
  return [
    {
      id: 'cover',
      pageNumber: 1,
      type: 'cover',
      layout: 'full-image',
      text: '',
      fontSize: 24,
      textAlignment: 'centre',
    },
    {
      id: 'page-1',
      pageNumber: 2,
      type: 'content',
      layout: 'text-bottom',
      text: '',
      fontSize: 16,
      textAlignment: 'left',
    },
    {
      id: 'back',
      pageNumber: 3,
      type: 'back',
      layout: 'text-only',
      text: 'The End',
      fontSize: 20,
      textAlignment: 'centre',
    },
  ];
}

export default function StorybookBuilderPage() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Storybook state
  const [title, setTitle] = useState(loaderData.title || 'Untitled Storybook');
  const [childName, setChildName] = useState(loaderData.childName || '');
  const [pages, setPages] = useState<StorybookPage[]>(
    loaderData.pages.length > 0 ? loaderData.pages : createInitialPages()
  );
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null);
  const [previewPage, setPreviewPage] = useState(1);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);

  // Get currently selected page
  const selectedPage = pages.find((p) => p.id === selectedPageId);

  // Convert to thumbnail strip format
  const thumbnailPages: StoryPage[] = pages.map((p) => ({
    id: p.id,
    pageNumber: p.pageNumber,
    thumbnailUrl: p.illustrationUrl,
    textPreview: p.text?.slice(0, 50),
    hasIllustration: !!p.illustrationUrl,
    isCover: p.type === 'cover',
  }));

  // Convert to preview format
  const previewPages: PreviewPage[] = pages.map((p) => ({
    id: p.id,
    pageNumber: p.pageNumber,
    type: p.type,
    title: p.type === 'cover' ? title : undefined,
    text: p.text,
    imageUrl: p.illustrationUrl,
    layout: p.layout,
  }));

  // Convert to editor format
  const editorPageData: PageData | null = selectedPage
    ? {
        id: selectedPage.id,
        text: selectedPage.text,
        illustrationUrl: selectedPage.illustrationUrl,
        layout: selectedPage.layout,
        fontSize: selectedPage.fontSize,
        textAlignment: selectedPage.textAlignment,
      }
    : null;

  // Mark as unsaved when changes occur
  useEffect(() => {
    setSaveStatus('unsaved');
  }, [pages, title, childName]);

  // Handle page selection
  const handlePageSelect = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      setPreviewPage(page.pageNumber);
    }
  }, [pages]);

  // Handle page update from editor
  const handlePageUpdate = useCallback((updatedData: PageData) => {
    setPages((prev) =>
      prev.map((p): StorybookPage =>
        p.id === updatedData.id
          ? {
              ...p,
              text: updatedData.text,
              illustrationUrl: updatedData.illustrationUrl,
              layout: updatedData.layout,
              fontSize: typeof updatedData.fontSize === 'number' ? updatedData.fontSize : p.fontSize,
              textAlignment: updatedData.textAlignment ?? p.textAlignment,
            }
          : p
      )
    );
  }, []);

  // Handle add page
  const handleAddPage = useCallback(() => {
    if (pages.length >= 32) return;

    // Insert before the back page
    const backPageIndex = pages.findIndex((p) => p.type === 'back');
    const newPageNumber = backPageIndex > 0 ? backPageIndex + 1 : pages.length;

    const newPage: StorybookPage = {
      id: `page-${Date.now()}`,
      pageNumber: newPageNumber,
      type: 'content',
      layout: 'text-bottom',
      text: '',
      fontSize: 16,
      textAlignment: 'left',
    };

    setPages((prev) => {
      const newPages = [...prev];
      if (backPageIndex >= 0) {
        newPages.splice(backPageIndex, 0, newPage);
      } else {
        newPages.push(newPage);
      }

      // Renumber pages
      return newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });

    setSelectedPageId(newPage.id);
  }, [pages]);

  // Handle delete page
  const handleDeletePage = useCallback(
    (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      if (!page || page.type === 'cover' || page.type === 'back') return;

      setPages((prev) => {
        const filtered = prev.filter((p) => p.id !== pageId);
        return filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      });

      // Select previous page or first page
      const pageIndex = pages.findIndex((p) => p.id === pageId);
      const newSelectedIndex = Math.max(0, pageIndex - 1);
      setSelectedPageId(pages[newSelectedIndex]?.id ?? null);
    },
    [pages]
  );

  // Handle pages reorder
  const handlePagesReorder = useCallback((reorderedThumbnails: StoryPage[]) => {
    setPages((prev) => {
      const pageMap = new Map(prev.map((p) => [p.id, p]));
      return reorderedThumbnails.map((thumb, i) => ({
        ...pageMap.get(thumb.id)!,
        pageNumber: i + 1,
      }));
    });
  }, []);

  // Handle illustration generation
  const handleGenerateIllustration = useCallback(async () => {
    if (!selectedPage) return;

    setIsGeneratingIllustration(true);

    try {
      // TODO: Call AI illustration generation API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulated response - in reality this would be the generated URL
      const mockUrl = `https://placehold.co/800x600/f0f9ff/0ea5e9?text=Illustration+${selectedPage.pageNumber}`;

      setPages((prev) =>
        prev.map((p) =>
          p.id === selectedPage.id ? { ...p, illustrationUrl: mockUrl } : p
        )
      );
    } catch (error) {
      console.error('Failed to generate illustration:', error);
    } finally {
      setIsGeneratingIllustration(false);
    }
  }, [selectedPage]);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // TODO: Save to database via action
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle preview page change
  const handlePreviewPageChange = useCallback((pageNumber: number) => {
    setPreviewPage(pageNumber);
    const page = pages.find((p) => p.pageNumber === pageNumber);
    if (page) {
      setSelectedPageId(page.id);
    }
  }, [pages]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/products/storybooks"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <BackIcon className="h-5 w-5" />
            </Link>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-none bg-transparent text-xl font-bold text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                placeholder="Enter storybook title..."
              />
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <SaveStatusIndicator status={saveStatus} />
                <span>{pages.length} pages</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="gap-2"
            >
              <PreviewIcon className="h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving || saveStatus === 'saved'}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="default" asChild>
              <Link to="/checkout?type=storybook">
                Continue to Checkout
              </Link>
            </Button>
          </div>
        </header>

        {/* Child Name Input */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="child-name"
                className="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Child&apos;s Name:
              </label>
              <input
                id="child-name"
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Enter the child's name for the story..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Page Thumbnail Strip */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <PageThumbnailStrip
              pages={thumbnailPages}
              selectedPageId={selectedPageId}
              onPageSelect={handlePageSelect}
              onPagesReorder={handlePagesReorder}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
              allowReorder
              showAddButton
              maxPages={32}
            />
          </CardContent>
        </Card>

        {/* Main Content: Editor + Preview */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Page Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Edit Page {selectedPage?.pageNumber ?? '-'}
                  {selectedPage?.type === 'cover' && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Cover)
                    </span>
                  )}
                  {selectedPage?.type === 'back' && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Back Cover)
                    </span>
                  )}
                </span>
                {selectedPage?.type === 'content' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateIllustration}
                    disabled={isGeneratingIllustration}
                    className="gap-2"
                  >
                    <WandIcon className="h-4 w-4" />
                    {isGeneratingIllustration ? 'Generating...' : 'Generate Illustration'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editorPageData ? (
                <PageEditor
                  pageData={editorPageData}
                  onPageUpdate={handlePageUpdate}
                  onGenerateIllustration={handleGenerateIllustration}
                  isGeneratingIllustration={isGeneratingIllustration}
                  showLayoutSelector={selectedPage?.type === 'content'}
                  showFontSize
                  showAlignment
                  maxTextLength={500}
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-gray-400">
                  Select a page to edit
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <BookPreview
                pages={previewPages}
                currentPage={previewPage}
                onPageChange={handlePreviewPageChange}
                showDots
                allowFullscreen
                aspectRatio="3:4"
              />
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Tips for creating your storybook
            </h4>
            <ul className="mt-2 grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                Click a page thumbnail to edit it
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                Drag thumbnails to reorder pages
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                Use AI to generate illustrations
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                Preview your book before ordering
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
            aria-label="Close preview"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
          <div className="w-full max-w-lg">
            <BookPreview
              pages={previewPages}
              currentPage={previewPage}
              onPageChange={handlePreviewPageChange}
              showDots
              allowAutoplay
              autoplayInterval={4000}
              aspectRatio="3:4"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Save status indicator
 */
function SaveStatusIndicator({ status }: { status: 'saved' | 'unsaved' | 'saving' }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs',
        status === 'saved' && 'text-green-600',
        status === 'unsaved' && 'text-amber-600',
        status === 'saving' && 'text-sky-600'
      )}
    >
      {status === 'saved' && (
        <>
          <CheckIcon className="h-3 w-3" />
          Saved
        </>
      )}
      {status === 'unsaved' && (
        <>
          <DotIcon className="h-3 w-3" />
          Unsaved changes
        </>
      )}
      {status === 'saving' && (
        <>
          <SpinnerIcon className="h-3 w-3 animate-spin" />
          Saving...
        </>
      )}
    </span>
  );
}

// Icons
function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function WandIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function DotIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={className} aria-hidden="true">
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeDasharray="30 60"
      />
    </svg>
  );
}
