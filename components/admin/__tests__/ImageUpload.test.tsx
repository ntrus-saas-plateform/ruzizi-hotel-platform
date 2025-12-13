/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUpload from '../ImageUpload';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ImageUpload Component', () => {
  const mockOnImagesChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders with empty state', () => {
    render(
      <ImageUpload 
        images={[]} 
        onImagesChange={mockOnImagesChange}
      />
    );

    expect(screen.getByText('Images (0/10)')).toBeInTheDocument();
    expect(screen.getByText('Ajouter des images')).toBeInTheDocument();
    expect(screen.getByText('Aucune image ajoutée')).toBeInTheDocument();
  });

  it('displays existing images', () => {
    const existingImages = [
      '/api/images/test1.webp',
      '/api/images/test2.webp'
    ];

    render(
      <ImageUpload 
        images={existingImages} 
        onImagesChange={mockOnImagesChange}
      />
    );

    expect(screen.getByText('Images (2/10)')).toBeInTheDocument();
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/api/images/test1.webp');
    expect(images[1]).toHaveAttribute('src', '/api/images/test2.webp');
  });

  it('displays base64 images for backward compatibility', () => {
    const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...';
    
    render(
      <ImageUpload 
        images={[base64Image]} 
        onImagesChange={mockOnImagesChange}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', base64Image);
  });

  it('handles file selection and upload', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        data: {
          results: [
            { url: '/api/images/new-image.webp' }
          ]
        }
      })
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <ImageUpload 
        images={[]} 
        onImagesChange={mockOnImagesChange}
      />
    );

    const fileInput = screen.getByRole('button', { name: /ajouter des images/i });
    expect(fileInput).toBeInTheDocument();

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Get the hidden file input
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/images/upload-blob', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalledWith(['/api/images/new-image.webp']);
    });
  });

  it('handles upload errors gracefully', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({
        message: 'Upload failed'
      })
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <ImageUpload 
        images={[]} 
        onImagesChange={mockOnImagesChange}
      />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    await waitFor(() => {
      expect(screen.getAllByText('Upload failed')).toHaveLength(2); // Error appears in both main error and progress
    });

    expect(mockOnImagesChange).not.toHaveBeenCalled();
  });

  it('removes images correctly', () => {
    const existingImages = [
      '/api/images/test1.webp',
      '/api/images/test2.webp'
    ];

    render(
      <ImageUpload 
        images={existingImages} 
        onImagesChange={mockOnImagesChange}
      />
    );

    // Hover over first image to show controls
    const firstImageContainer = screen.getAllByRole('img')[0].closest('.group');
    fireEvent.mouseEnter(firstImageContainer!);

    // Click remove button
    const removeButton = screen.getAllByTitle('Supprimer')[0];
    fireEvent.click(removeButton);

    expect(mockOnImagesChange).toHaveBeenCalledWith(['/api/images/test2.webp']);
  });

  it('reorders images correctly', () => {
    const existingImages = [
      '/api/images/test1.webp',
      '/api/images/test2.webp'
    ];

    render(
      <ImageUpload 
        images={existingImages} 
        onImagesChange={mockOnImagesChange}
      />
    );

    // Hover over first image to show controls
    const firstImageContainer = screen.getAllByRole('img')[0].closest('.group');
    fireEvent.mouseEnter(firstImageContainer!);

    // Click move right button
    const moveRightButton = screen.getByTitle('Déplacer à droite');
    fireEvent.click(moveRightButton);

    expect(mockOnImagesChange).toHaveBeenCalledWith([
      '/api/images/test2.webp',
      '/api/images/test1.webp'
    ]);
  });

  it('respects maxImages limit', () => {
    const existingImages = Array(5).fill(0).map((_, i) => `/api/images/test${i}.webp`);

    render(
      <ImageUpload 
        images={existingImages} 
        onImagesChange={mockOnImagesChange}
        maxImages={5}
      />
    );

    expect(screen.getByText('Images (5/5)')).toBeInTheDocument();
    
    const addButton = screen.getByRole('button', { name: /ajouter des images/i });
    expect(addButton).toBeDisabled();
  });
});