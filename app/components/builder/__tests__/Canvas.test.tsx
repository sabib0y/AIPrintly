/**
 * Canvas Component Tests
 *
 * Tests for the main builder canvas component including:
 * - Rendering design elements
 * - Drag interactions
 * - Scale and rotation
 * - Print area boundaries
 * - Responsive behaviour
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Canvas } from '../Canvas';
import type { DesignElement, PrintArea } from '../types';

// Mock design element
const createMockElement = (overrides: Partial<DesignElement> = {}): DesignElement => ({
  id: 'elem-1',
  imageUrl: 'https://example.com/image.jpg',
  imageWidth: 800,
  imageHeight: 600,
  transform: {
    position: { x: 450, y: 190 },
    scale: 1,
    rotation: 0,
  },
  isSelected: false,
  ...overrides,
});

// Mock print area
const mockPrintArea: PrintArea = {
  width: 900,
  height: 380,
  bleedMargin: 20,
  minDpi: 150,
  minOverlap: 0.3,
};

describe('Canvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the canvas container', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('builder-canvas')).toBeInTheDocument();
    });

    it('should render print area overlay', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('print-area-overlay')).toBeInTheDocument();
    });

    it('should render design elements', () => {
      const elements = [createMockElement({ id: 'elem-1' })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('design-element-elem-1')).toBeInTheDocument();
    });

    it('should render element image', () => {
      const elements = [createMockElement()];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should show selection handles for selected element', () => {
      const elements = [createMockElement({ isSelected: true })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('selection-handles')).toBeInTheDocument();
    });

    it('should not show selection handles for unselected elements', () => {
      const elements = [createMockElement({ isSelected: false })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      expect(screen.queryByTestId('selection-handles')).not.toBeInTheDocument();
    });
  });

  describe('element selection', () => {
    it('should call onElementSelect when element is clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      const elements = [createMockElement({ id: 'elem-1' })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={handleSelect}
        />
      );

      await user.click(screen.getByTestId('design-element-elem-1'));

      expect(handleSelect).toHaveBeenCalledWith('elem-1');
    });

    it('should call onElementSelect with null when clicking empty area', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      const elements = [createMockElement({ isSelected: true })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={handleSelect}
        />
      );

      await user.click(screen.getByTestId('builder-canvas'));

      expect(handleSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('drag interactions', () => {
    it('should call onElementUpdate when dragging element', () => {
      const handleUpdate = vi.fn();
      const elements = [createMockElement({ isSelected: true })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={handleUpdate}
          onElementSelect={vi.fn()}
        />
      );

      const element = screen.getByTestId('design-element-elem-1');

      // Simulate drag
      fireEvent.mouseDown(element, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(document, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(document);

      expect(handleUpdate).toHaveBeenCalled();
    });

    it('should update element position during drag', () => {
      const handleUpdate = vi.fn();
      const elements = [
        createMockElement({
          isSelected: true,
          transform: { position: { x: 100, y: 100 }, scale: 1, rotation: 0 },
        }),
      ];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={handleUpdate}
          onElementSelect={vi.fn()}
        />
      );

      const element = screen.getByTestId('design-element-elem-1');

      fireEvent.mouseDown(element, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(document);

      const updateCall = handleUpdate.mock.calls[handleUpdate.mock.calls.length - 1];
      expect(updateCall[0].transform.position.x).toBeGreaterThan(100);
      expect(updateCall[0].transform.position.y).toBeGreaterThan(100);
    });
  });

  describe('zoom controls', () => {
    it('should render zoom controls', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
          showZoomControls
        />
      );

      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    });

    it('should zoom in when zoom in button clicked', async () => {
      const user = userEvent.setup();

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
          showZoomControls
        />
      );

      const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
      await user.click(zoomInBtn);

      // Zoom level should be displayed
      expect(screen.getByTestId('zoom-level')).toHaveTextContent(/\d+%/);
    });
  });

  describe('print area display', () => {
    it('should display print area dimensions', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
          showDimensions
        />
      );

      expect(screen.getByTestId('print-area-dimensions')).toBeInTheDocument();
    });

    it('should show bleed margin indicator', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
          showBleedMargin
        />
      );

      expect(screen.getByTestId('bleed-margin-indicator')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show upload prompt when no elements', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });

    it('should accept dropped images', () => {
      const handleDrop = vi.fn();

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
          onImageDrop={handleDrop}
        />
      );

      const canvas = screen.getByTestId('builder-canvas');
      const file = new File([''], 'test.png', { type: 'image/png' });

      fireEvent.drop(canvas, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      });

      expect(handleDrop).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should delete selected element on Delete key', async () => {
      const user = userEvent.setup();
      const handleDelete = vi.fn();
      const elements = [createMockElement({ isSelected: true })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
          onElementDelete={handleDelete}
        />
      );

      await user.keyboard('{Delete}');

      expect(handleDelete).toHaveBeenCalledWith('elem-1');
    });

    it('should rotate element with R key', async () => {
      const user = userEvent.setup();
      const handleUpdate = vi.fn();
      const elements = [createMockElement({ isSelected: true })];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={handleUpdate}
          onElementSelect={vi.fn()}
        />
      );

      await user.keyboard('r');

      const lastCall = handleUpdate.mock.calls[handleUpdate.mock.calls.length - 1];
      expect(lastCall[0].transform.rotation).not.toBe(0);
    });
  });

  describe('accessibility', () => {
    it('should have accessible canvas container', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      const canvas = screen.getByTestId('builder-canvas');
      expect(canvas).toHaveAttribute('role', 'application');
      expect(canvas).toHaveAttribute('aria-label');
    });

    it('should have accessible design elements', () => {
      const elements = [createMockElement()];

      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={elements}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      const element = screen.getByTestId('design-element-elem-1');
      expect(element).toHaveAttribute('aria-label');
    });
  });

  describe('responsive behaviour', () => {
    it('should scale canvas to fit container', () => {
      render(
        <Canvas
          productType="mug"
          printArea={mockPrintArea}
          elements={[]}
          onElementUpdate={vi.fn()}
          onElementSelect={vi.fn()}
        />
      );

      const canvas = screen.getByTestId('builder-canvas');
      expect(canvas).toHaveStyle({ overflow: 'hidden' });
    });
  });
});
