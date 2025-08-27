import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    let scanInterval: NodeJS.Timeout;

    if (isOpen && webcamRef.current) {
      setIsScanning(true);
      setError(null);
      
      // Start scanning
      scanInterval = setInterval(async () => {
        if (webcamRef.current?.video?.readyState === 4) {
          try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
              const result = await codeReader.current.decodeFromImage(undefined, imageSrc);
              if (result) {
                onScan(result.getText());
                setIsScanning(false);
                onClose();
              }
            }
          } catch (err) {
            if (!(err instanceof NotFoundException)) {
              console.error("Barcode scanning error:", err);
            }
          }
        }
      }, 500); // Scan every 500ms
    }

    return () => {
      if (scanInterval) {
        clearInterval(scanInterval);
      }
      setIsScanning(false);
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Scan Barcode</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full rounded-lg"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "environment" // Use back camera if available
              }}
              onUserMediaError={(error) => {
                console.error("Camera error:", error);
                setError("Camera access denied or not available");
              }}
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-primary rounded-lg">
              <div className="absolute inset-4 border border-primary/50 rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
              </div>
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-md text-sm">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Scanning...
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Position the barcode within the frame to scan
          </div>

          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
            data-testid="button-cancel-scan"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}