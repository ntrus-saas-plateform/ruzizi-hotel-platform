'use client';

import React from 'react';

interface SafeRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: string;
}

export default function SafeRender({ children, fallback, context = 'unknown' }: SafeRenderProps) {
  // Fonction pour vérifier si une valeur est un objet non-React
  const isValidChild = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return true; // Les tableaux sont valides (React les gère)
    if (React.isValidElement(value)) return true; // Les éléments React sont valides
    
    // Si c'est un objet, c'est problématique
    if (typeof value === 'object') {
      console.error(`🚨 GLOBAL SAFE RENDER: Invalid object found in ${context}:`, value);
      console.trace(`📍 Stack trace for ${context}`);
      return false;
    }
    
    return true;
  };

  // Vérifier chaque enfant
  const safeChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return child;
    }
    
    if (!isValidChild(child)) {
      return fallback || <span>[Invalid Object]</span>;
    }
    
    return child;
  });

  return <>{safeChildren}</>;
}
