import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, AlertCircle } from 'lucide-react';

export default function BarcodeScanner({ onScanSuccess, onClose }) {
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const startScanning = () => {
    // Import BarcodeDetector dynamically
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
      });

      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue;
              stopCamera();
              onScanSuccess(barcode);
            }
          } catch (err) {
            // Silent fail, keep scanning
          }
        }
      }, 300);
    } else {
      // Fallback: Use ZXing library for browsers without BarcodeDetector
      useFallbackScanner();
    }
  };

  const useFallbackScanner = async () => {
    try {
      // Dynamically import ZXing
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      const codeReader = new BrowserMultiFormatReader();
      
      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && canvasRef.current) {
          try {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const result = await codeReader.decodeFromCanvas(canvas);
            if (result) {
              stopCamera();
              onScanSuccess(result.text);
            }
          } catch (err) {
            // Silent fail, keep scanning
          }
        }
      }, 300);
    } catch (err) {
      setError('Barcode scanning not supported on this device. Please enter barcode manually.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6" />
          <span className="font-semibold">Scan Barcode</span>
        </div>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning Overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Scanning Frame */}
              <div className="w-64 h-40 border-4 border-emerald-500 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                
                {/* Scanning Line Animation */}
                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 animate-scan" />
              </div>
              
              <div className="mt-4 text-white text-center bg-black/50 px-4 py-2 rounded-lg">
                Position barcode within frame
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-2">Scanning Error</div>
              <div className="text-sm text-gray-600 mb-4">{error}</div>
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="w-full py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-900 text-white p-4 text-center text-sm">
        <p className="text-gray-300">Align barcode within the frame</p>
        <p className="text-gray-400 text-xs mt-1">Works with UPC and EAN barcodes</p>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 4px); }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
