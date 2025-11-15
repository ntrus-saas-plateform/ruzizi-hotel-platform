'use client';

import { useState, useEffect } from 'react';

export default function TestImagesPage() {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/public/establishments');
      const data = await response.json();
      if (data.success) {
        setEstablishments(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Test Images Display</h1>
      
      {establishments.map((est) => (
        <div key={est.id} className="mb-12 border-b pb-8">
          <h2 className="text-2xl font-bold mb-4">{est.name}</h2>
          
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Image Data:</h3>
            <div className="text-sm space-y-1">
              <p><strong>Has images:</strong> {est.images && est.images.length > 0 ? 'Yes' : 'No'}</p>
              <p><strong>Image count:</strong> {est.images?.length || 0}</p>
              {est.images && est.images[0] && (
                <>
                  <p><strong>First image length:</strong> {est.images[0].length} characters</p>
                  <p><strong>Is base64:</strong> {est.images[0].startsWith('data:image') ? 'Yes' : 'No'}</p>
                  <p><strong>MIME type:</strong> {est.images[0].match(/data:([^;]+);/)?.[1] || 'Unknown'}</p>
                  <p><strong>Preview:</strong> {est.images[0].substring(0, 100)}...</p>
                </>
              )}
            </div>
          </div>

          {est.images && est.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {est.images.map((img: string, idx: number) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-200 p-2 text-sm font-semibold">
                    Image {idx + 1} ({Math.round(img.length / 1024)}KB)
                  </div>
                  <div className="aspect-video bg-gray-100 relative">
                    <img
                      src={img}
                      alt={`${est.name} - Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => console.log(`✅ Image ${idx + 1} loaded for ${est.name}`)}
                      onError={(e) => {
                        console.error(`❌ Image ${idx + 1} failed for ${est.name}`);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'absolute inset-0 flex items-center justify-center bg-red-100 text-red-600 text-sm p-4';
                          errorDiv.textContent = 'Failed to load image';
                          parent.appendChild(errorDiv);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!est.images || est.images.length === 0) && (
            <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">No images available for this establishment</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
