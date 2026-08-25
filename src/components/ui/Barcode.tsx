'use client';

import React from 'react';
import { generateBarcodeSVG } from '../../lib/barcodeGenerator';

interface BarcodeProps {
  value: string;
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  fontSize?: number;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  height = 36,
  moduleWidth = 1.4,
  showText = true,
  fontSize = 10,
  className = '',
}) => {
  const svgHtml = generateBarcodeSVG(value, {
    height,
    moduleWidth,
    showText,
    fontSize,
  });

  return (
    <div
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};
