import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Undo2,
  RotateCcw,
  Type,
  Check,
  PenTool,
} from 'lucide-react';
import { JobSitePhoto, estimateDataUrlSizeKb } from '../utils/calculators';
import { useModalKeyboard, handleSegmentedKeyDown } from '../utils/useModalKeyboard';

interface PhotoAnnotationModalProps {
  photo: JobSitePhoto | null;
  onClose: () => void;
  onSaveAnnotatedPhoto: (id: string, newDataUrl: string, newSizeKb: number) => void;
}

type PenColor = '#ef4444' | '#facc15' | '#ffffff';

interface Point {
  x: number;
  y: number;
}

type MarkupAction =
  | {
      type: 'stroke';
      color: PenColor;
      lineWidth: number;
      points: Point[];
    }
  | {
      type: 'stamp';
      text: string;
      color: PenColor;
      x: number;
      y: number;
    };

const PEN_OPTIONS: { color: PenColor; label: string; swatchClass: string }[] = [
  { color: '#ef4444', label: 'Red Pen', swatchClass: 'bg-red-500' },
  { color: '#facc15', label: 'Yellow Pen', swatchClass: 'bg-yellow-400' },
  { color: '#ffffff', label: 'White Pen', swatchClass: 'bg-white border border-slate-300' },
];
const PEN_COLOR_VALUES: readonly PenColor[] = ['#ef4444', '#facc15', '#ffffff'];

export const PhotoAnnotationModal: React.FC<PhotoAnnotationModalProps> = ({
  photo,
  onClose,
  onSaveAnnotatedPhoto,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  const [penColor, setPenColor] = useState<PenColor>('#ef4444');
  const [actions, setActions] = useState<MarkupAction[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const [stampText, setStampText] = useState<string>('DEMO / REPAIR AREA');
  const [canvasDims, setCanvasDims] = useState<{ w: number; h: number }>({ w: 800, h: 520 });
  const modalRef = useModalKeyboard(Boolean(photo), onClose);

  // Load base image when modal opens
  useEffect(() => {
    if (!photo) return;
    setActions([]);
    setCurrentStroke(null);

    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth || img.width || 800;
      let h = img.naturalHeight || img.height || 520;
      if (w > 900 || h > 900) {
        if (w >= h) {
          h = Math.round((h * 900) / w);
          w = 900;
        } else {
          w = Math.round((w * 900) / h);
          h = 900;
        }
      }
      baseImageRef.current = img;
      setCanvasDims({ w, h });
    };
    img.src = photo.dataUrl;
  }, [photo]);

  // Redraw canvas whenever base image, actions, or currentStroke change
  useEffect(() => {
    const canvas = canvasRef.current;
    const baseImg = baseImageRef.current;
    if (!canvas || !baseImg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    const drawStroke = (color: PenColor, lineWidth: number, pts: Point[]) => {
      if (pts.length === 0) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawStamp = (text: string, color: PenColor, x: number, y: number) => {
      ctx.save();
      ctx.font = 'bold 20px sans-serif';
      const metrics = ctx.measureText(text);
      const padX = 12;
      const boxH = 34;
      const boxW = metrics.width + padX * 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(x, y - boxH + 8, boxW, boxH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y - boxH + 8, boxW, boxH);

      ctx.fillStyle = color;
      ctx.fillText(text, x + padX, y);
      ctx.restore();
    };

    for (const action of actions) {
      if (action.type === 'stroke') {
        drawStroke(action.color, action.lineWidth, action.points);
      } else {
        drawStamp(action.text, action.color, action.x, action.y);
      }
    }

    if (currentStroke && currentStroke.length > 0) {
      drawStroke(penColor, 5, currentStroke);
    }
  }, [actions, currentStroke, penColor, canvasDims]);

  if (!photo) return null;

  const getCanvasPoint = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (!pt) return;
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke) return;
    e.preventDefault();
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (!pt) return;
    setCurrentStroke((prev) => (prev ? [...prev, pt] : [pt]));
  };

  const handlePointerUp = () => {
    if (currentStroke && currentStroke.length > 0) {
      setActions((prev) => [
        ...prev,
        {
          type: 'stroke',
          color: penColor,
          lineWidth: 5,
          points: currentStroke,
        },
      ]);
      setCurrentStroke(null);
    }
  };

  const handleAddTextStamp = () => {
    const trimmed = stampText.trim();
    if (!trimmed) return;
    const stampCount = actions.filter((a) => a.type === 'stamp').length;
    const yPos = Math.min(canvasDims.h - 24, 52 + stampCount * 42);
    setActions((prev) => [
      ...prev,
      {
        type: 'stamp',
        text: trimmed.toUpperCase(),
        color: penColor,
        x: 28,
        y: yPos,
      },
    ]);
  };

  const handleUndo = () => {
    setActions((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setActions([]);
    setCurrentStroke(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
    const newSizeKb = estimateDataUrlSizeKb(compressedDataUrl);
    onSaveAnnotatedPhoto(photo.id, compressedDataUrl, newSizeKb);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="annotate-modal-title"
      data-testid="photo-annotation-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 no-print overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-xl relative my-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Photo Annotation Modal"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 id="annotate-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Annotate &amp; Markup Job Site Photo
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Draw directly on the photo or stamp callouts for your Client PDF Quote
            </p>
          </div>
        </div>

        {/* Drawing Controls Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
          {/* Pen Color Buttons */}
          <div
            className="flex items-center gap-1.5"
            role="radiogroup"
            aria-label="Markup Pen Colors"
            onKeyDown={(e) =>
              handleSegmentedKeyDown(e, PEN_COLOR_VALUES, penColor, setPenColor)
            }
          >
            {PEN_OPTIONS.map((opt, idx) => (
              <button
                key={opt.color}
                type="button"
                role="radio"
                aria-checked={penColor === opt.color}
                data-autofocus={idx === 0 ? 'true' : undefined}
                onClick={() => setPenColor(opt.color)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  penColor === opt.color
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${opt.swatchClass}`} />
                <span>{opt.label.replace(' Pen', '')}</span>
              </button>
            ))}
          </div>

          {/* Undo & Clear Markup */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={actions.length === 0}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={actions.length === 0}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Text Stamp Overlay Controls */}
        <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Type className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Text Stamp Label"
              value={stampText}
              onChange={(e) => setStampText(e.target.value)}
              placeholder="Enter callout stamp text (e.g., REPLACE TILE AREA)"
              className="w-full min-h-[40px] pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddTextStamp}
            data-testid="add-text-stamp-btn"
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Text Stamp</span>
          </button>
        </div>

        {/* Interactive HTML5 Drawing Canvas */}
        <div className="mt-3 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-950 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={canvasDims.w}
            height={canvasDims.h}
            tabIndex={0}
            role="img"
            aria-label="Interactive job site photo markup canvas. Press Enter or Space to stamp callout text, or Backspace to undo last markup."
            data-testid="annotation-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddTextStamp();
              } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                handleUndo();
              }
            }}
            className="w-full max-h-[360px] object-contain touch-none cursor-crosshair"
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Draw with mouse or finger · Output auto-compressed to JPEG (0.72)
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              data-testid="save-annotation-btn"
              className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>Save Markup to Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
