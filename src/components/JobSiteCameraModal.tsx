import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  Trash2,
  Image as ImageIcon,
  PenTool,
  Download,
} from 'lucide-react';
import { JobSitePhoto, estimateDataUrlSizeKb } from '../utils/calculators';
import {
  compressDataUrlToJpeg,
  compressSourceToJpeg,
  generateSimulatedSitePhotoJpeg,
  downloadJobSitePhotoJpeg,
} from '../utils/imageTools';
import { useModalKeyboard } from '../utils/useModalKeyboard';

interface JobSiteCameraModalProps {
  isOpen: boolean;
  existingPhotos: JobSitePhoto[];
  onClose: () => void;
  onSavePhoto: (photo: Omit<JobSitePhoto, 'id'>) => void;
  onRemovePhoto: (id: string) => void;
  onAnnotatePhoto: (photo: JobSitePhoto) => void;
}

export const JobSiteCameraModal: React.FC<JobSiteCameraModalProps> = ({
  isOpen,
  existingPhotos,
  onClose,
  onSavePhoto,
  onRemovePhoto,
  onAnnotatePhoto,
}) => {
  const [caption, setCaption] = useState<string>('Main Job Site / Room Area');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewSizeKb, setPreviewSizeKb] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useModalKeyboard(isOpen, onClose);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const startLiveCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream unavailable');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsStreaming(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      const fallback = generateSimulatedSitePhotoJpeg(caption);
      setPreviewDataUrl(fallback.dataUrl);
      setPreviewSizeKb(fallback.sizeKb);
      setCameraError(
        'Live camera unavailable in this browser environment — captured compressed simulated job-site snapshot instead (or upload any photo file below).'
      );
    }
  };

  const captureFromVideo = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const compressed = compressSourceToJpeg(
        videoRef.current,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
      setPreviewDataUrl(compressed.dataUrl);
      setPreviewSizeKb(compressed.sizeKb);
      stopCameraStream();
    } else {
      const fallback = generateSimulatedSitePhotoJpeg(caption);
      setPreviewDataUrl(fallback.dataUrl);
      setPreviewSizeKb(fallback.sizeKb);
      stopCameraStream();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError('');
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressDataUrlToJpeg(reader.result);
        setPreviewDataUrl(compressed.dataUrl);
        setPreviewSizeKb(compressed.sizeKb);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInstantSampleCapture = () => {
    setCameraError('');
    const sim = generateSimulatedSitePhotoJpeg(caption);
    setPreviewDataUrl(sim.dataUrl);
    setPreviewSizeKb(sim.sizeKb);
  };

  const handleSaveToQuote = () => {
    const fallback = previewDataUrl
      ? { dataUrl: previewDataUrl, sizeKb: previewSizeKb || estimateDataUrlSizeKb(previewDataUrl) }
      : generateSimulatedSitePhotoJpeg(caption);

    const now = new Date();
    const formattedTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    onSavePhoto({
      dataUrl: fallback.dataUrl,
      baseDataUrl: fallback.dataUrl,
      caption: caption.trim() || 'Job Site Photo',
      timestamp: formattedTime,
      sizeKb: fallback.sizeKb,
    });
    setPreviewDataUrl(null);
    setPreviewSizeKb(0);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-site-camera-title"
      data-testid="job-site-camera-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 no-print overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl relative my-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Job Site Camera Modal"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 id="job-site-camera-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Job Site Camera &amp; Photo Attachment
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Auto-compresses to max 900px JPEG (0.72) for offline storage &amp; Client PDF Quotes
            </p>
          </div>
        </div>

        {/* Hidden Native Camera / File Upload Input */}
        <input
          ref={fileInputRef}
          id="job-site-photo-upload"
          data-testid="job-site-photo-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
        />

        {/* Action Buttons: Take Photo / Upload File / Instant Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5">
          <button
            type="button"
            data-autofocus="true"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Upload / Camera</span>
          </button>

          <button
            type="button"
            onClick={isStreaming ? captureFromVideo : startLiveCamera}
            className="min-h-[44px] px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            <span>{isStreaming ? 'Snap Frame Now' : 'Use Live Camera'}</span>
          </button>

          <button
            type="button"
            onClick={handleInstantSampleCapture}
            className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ImageIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Snap Site Preview</span>
          </button>
        </div>

        {cameraError && (
          <p className="mt-2.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2">
            {cameraError}
          </p>
        )}

        {/* Live Video Viewfinder or Captured Image Preview */}
        <div className="mt-4">
          {isStreaming ? (
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={captureFromVideo}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Capture Photo
              </button>
            </div>
          ) : previewDataUrl ? (
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 aspect-video">
              <img
                src={previewDataUrl}
                alt="Captured job site preview"
                data-testid="camera-modal-preview-img"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/85 text-amber-400 font-mono text-xs font-semibold">
                Compressed: {previewSizeKb} KB JPEG
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl(null);
                  setPreviewSizeKb(0);
                }}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-medium hover:bg-slate-900 cursor-pointer"
              >
                Retake / Clear
              </button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Take or upload a room or job site photo"
              data-testid="camera-upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 p-6 text-center cursor-pointer transition-colors"
            >
              <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Click or Press Enter to Take or Upload a Room / Job Site Photo
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Automatically scaled to max 900px &amp; compressed via JPEG (0.72)
              </p>
            </div>
          )}
        </div>

        {/* Photo Caption Input */}
        <div className="mt-4">
          <label
            htmlFor="job-site-photo-caption"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Photo Label / Room Area Note
          </label>
          <input
            id="job-site-photo-caption"
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g., Rear Patio Concrete Slab Area - Before Pour"
            className="w-full min-h-[42px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>

        {/* Save Photo into Project Quote CTA */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveToQuote}
            data-testid="save-site-photo-btn"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Photo to Project Quote</span>
          </button>
        </div>

        {/* Existing Saved Photos List */}
        {existingPhotos.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              Saved Job Site Photos in Quote ({existingPhotos.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {existingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/60 p-2"
                >
                  <div className="relative">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/85 text-amber-400 font-mono text-[10px] font-semibold">
                      {photo.sizeKb} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(photo.id)}
                      aria-label={`Remove photo ${photo.caption}`}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {photo.caption}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAnnotatePhoto(photo);
                      }}
                      className="flex-1 min-h-[32px] px-2 py-1 rounded-lg bg-slate-900 dark:bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <PenTool className="w-3 h-3 text-amber-400" />
                      <span>Annotate / Draw</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadJobSitePhotoJpeg(photo)}
                      className="flex-1 min-h-[32px] px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                      <span>Download JPEG</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
