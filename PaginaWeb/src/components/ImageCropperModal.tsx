import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

interface ImageCropperModalProps {
  imageSrc: string;
  aspectRatio: number;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  aspectRatio,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedImageFile) {
        onCropComplete(croppedImageFile);
      }
    } catch (e) {
      console.error(e);
      alert('Error al recortar la imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'absolute inset-0',
          }}
        />
      </div>

      <div className="h-32 bg-[#0d1117] border-t border-[#30363d] flex flex-col items-center justify-center px-6 relative z-[101]">
        
        <div className="w-full max-w-md flex items-center gap-4 mb-4">
          <span className="material-symbols-outlined text-slate-400">zoom_out</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1 bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="material-symbols-outlined text-slate-400">zoom_in</span>
        </div>

        <div className="flex gap-4 w-full max-w-md">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">crop</span>
            )}
            Recortar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
