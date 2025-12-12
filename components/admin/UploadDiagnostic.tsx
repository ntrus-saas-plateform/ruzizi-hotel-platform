/**
 * Upload Diagnostic Component
 * Helps diagnose upload configuration issues
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings } from 'lucide-react';

interface DiagnosticData {
  environment: string;
  isProduction: boolean;
  blobConfigured: boolean;
  databaseConfigured: boolean;
  timestamp: string;
  recommendations: string[];
}

interface UploadDiagnosticProps {
  className?: string;
}

export default function UploadDiagnostic({ className = '' }: UploadDiagnosticProps) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/config');
      const data = await response.json();
      
      if (data.success) {
        setDiagnostic(data.data);
      } else {
        setError(data.error || 'Failed to fetch diagnostic');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  if (loading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-600">Checking configuration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-800">Diagnostic Error</span>
        </div>
        <p className="text-xs text-red-700 mb-2">{error}</p>
        <button
          onClick={fetchDiagnostic}
          className="text-xs text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!diagnostic) return null;

  const getStatusIcon = (configured: boolean) => {
    return configured ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (configured: boolean) => {
    return configured ? 'text-green-700' : 'text-red-700';
  };

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Upload Configuration</h3>
        <button
          onClick={fetchDiagnostic}
          className="ml-auto text-xs text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Environment:</span>
          <span className={`font-medium ${diagnostic.isProduction ? 'text-blue-700' : 'text-gray-700'}`}>
            {diagnostic.environment}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Vercel Blob:</span>
          <div className="flex items-center gap-1">
            {getStatusIcon(diagnostic.blobConfigured)}
            <span className={`font-medium ${getStatusColor(diagnostic.blobConfigured)}`}>
              {diagnostic.blobConfigured ? 'Configured' : 'Missing Token'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Database:</span>
          <div className="flex items-center gap-1">
            {getStatusIcon(diagnostic.databaseConfigured)}
            <span className={`font-medium ${getStatusColor(diagnostic.databaseConfigured)}`}>
              {diagnostic.databaseConfigured ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>

      {diagnostic.recommendations.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Recommendations:</h4>
          <div className="space-y-1">
            {diagnostic.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                {rec.startsWith('✅') ? (
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-xs text-gray-600 leading-relaxed">
                  {rec.replace('✅ ', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-2 border-t">
        <span className="text-xs text-gray-400">
          Last checked: {new Date(diagnostic.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}