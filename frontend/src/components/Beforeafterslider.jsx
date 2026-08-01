import { useRef, useCallback, useEffect } from "react";
import { Move } from "lucide-react";

/**
 * BeforeAfterSlider
 * Draggable before/after comparison. Pointer-events based so it works
 * with mouse, touch and pen without extra libraries.
 *
 * Props:
 * - beforeUrl, afterUrl: image URLs
 * - beforeLabel, afterLabel: small tag text (default "Avant" / "Après")
 * - caption: optional text shown under the slider (e.g. project title)
 */
export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Avant",
  afterLabel = "Après",
  caption,
}) {
  const wrapRef = useRef(null);
  const beforeRef = useRef(null);
  const handleRef = useRef(null);
  const draggingRef = useRef(false);

  const setPos = useCallback((clientX) => {
    const wrap = wrapRef.current;
    const before = beforeRef.current;
    const handle = handleRef.current;
    if (!wrap || !before || !handle) return;
    const rect = wrap.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(2, Math.min(98, pct));
    before.style.width = `${pct}%`;
    handle.style.left = `${pct}%`;
  }, []);

  const onPointerDown = (e) => {
    draggingRef.current = true;
    setPos(e.clientX);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (draggingRef.current) setPos(e.clientX);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const syncWidth = useCallback(() => {
    const wrap = wrapRef.current;
    const beforeImg = beforeRef.current?.querySelector("img");
    if (wrap && beforeImg) beforeImg.style.width = `${wrap.getBoundingClientRect().width}px`;
  }, []);

  useEffect(() => {
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, [syncWidth]);

  return (
    <div>
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        data-testid="before-after-slider"
        className="relative rounded-[20px] overflow-hidden aspect-video max-w-3xl mx-auto shadow-[0_30px_60px_rgba(0,0,0,0.25)] cursor-ew-resize select-none"
      >
        {/* After (full width, base layer) */}
        <div className="absolute inset-0">
          <img src={afterUrl} alt={afterLabel} className="w-full h-full object-cover" draggable={false} />
        </div>
        {/* Before (clipped by width, overlay layer) */}
        <div ref={beforeRef} className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
          <img
            src={beforeUrl}
            alt={beforeLabel}
            draggable={false}
            className="h-full object-cover max-w-none"
          />
        </div>

        <span className="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-wide text-white bg-black/55 px-3 py-1.5 rounded-full">
          {beforeLabel}
        </span>
        <span className="absolute top-4 right-4 text-[11px] font-bold uppercase tracking-wide text-white bg-black/55 px-3 py-1.5 rounded-full">
          {afterLabel}
        </span>

        <div
          ref={handleRef}
          className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none"
          style={{ left: "50%", transform: "translateX(-50%)" }}
        >
          <div className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.4)]" />
          <div className="w-11 h-11 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex items-center justify-center relative z-10">
            <Move className="w-4 h-4 text-[#0F1222]" />
          </div>
        </div>
      </div>
      {caption && <p className="text-center mt-3.5 text-sm text-[#6B7280]">{caption}</p>}
    </div>
  );
}