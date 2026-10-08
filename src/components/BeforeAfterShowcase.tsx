import React, { useState, useRef, useEffect, useCallback } from "react";
import { CONFIG, ComparisonItem } from "../config";

interface BeforeAfterShowcaseProps {
  onSelectServiceForQuote: (serviceId: "sofa" | "carpet" | "car" | "mattress") => void;
}

export const BeforeAfterShowcase: React.FC<BeforeAfterShowcaseProps> = ({
  onSelectServiceForQuote
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // sliderPosition = % of the BEFORE (dirty) layer visible from the left.
  // So 0% = 100% Clean (Depois), 100% = 100% Dirty (Antes).
  const [sliderPosition, setSliderPosition] = useState(48);
  const [isDragging, setIsDragging] = useState(false);
  const [isSmoothAnimating, setIsSmoothAnimating] = useState(false);
  const [isAutoSweeping, setIsAutoSweeping] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [mediaFadeKey, setMediaFadeKey] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sweepTimeoutsRef = useRef<number[]>([]);
  const hasAutoPlayedOnScroll = useRef(false);

  const currentItem: ComparisonItem = CONFIG.comparisons[currentIndex];
  // Clean percentage revealed (on the right side of the handle)
  const cleanPercentage = Math.round(100 - sliderPosition);

  const clearSweepTimers = useCallback(() => {
    sweepTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    sweepTimeoutsRef.current = [];
  }, []);

  const triggerSmoothPosition = useCallback(
    (targetPos: number, durationMs = 850) => {
      clearSweepTimers();
      setIsAutoSweeping(false);
      setIsSmoothAnimating(true);
      setSliderPosition(targetPos);
      const t = window.setTimeout(() => {
        setIsSmoothAnimating(false);
      }, durationMs);
      sweepTimeoutsRef.current.push(t);
    },
    [clearSweepTimers]
  );

  const runExtractionDemo = useCallback(() => {
    clearSweepTimers();
    setIsSmoothAnimating(true);
    setIsAutoSweeping(true);
    // Step 1: Show mostly dirty state (88% before visible)
    setSliderPosition(88);

    // Step 2: Sweep across to reveal the clean result (12% before visible = 88% clean)
    const t1 = window.setTimeout(() => {
      setSliderPosition(12);
    }, 550);

    // Step 3: Settle at an impactful comparison split (38% before, 62% clean)
    const t2 = window.setTimeout(() => {
      setSliderPosition(36);
    }, 1750);

    const t3 = window.setTimeout(() => {
      setIsSmoothAnimating(false);
      setIsAutoSweeping(false);
    }, 2600);

    sweepTimeoutsRef.current.push(t1, t2, t3);
  }, [clearSweepTimers]);

  // Trigger a gentle initial reveal sweep when the user scrolls to #antes-depois
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAutoPlayedOnScroll.current) {
            hasAutoPlayedOnScroll.current = true;
            runExtractionDemo();
          }
        });
      },
      { threshold: 0.45 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [runExtractionDemo]);

  useEffect(() => {
    return () => clearSweepTimers();
  }, [clearSweepTimers]);

  const handleSelectComparison = (index: number) => {
    if (index === currentIndex) return;
    clearSweepTimers();
    setCurrentIndex(index);
    setActiveHotspot(null);
    setMediaFadeKey((k) => k + 1);
    // Run a smooth transition from 78% -> 36% on category switch to highlight improvement
    setIsSmoothAnimating(true);
    setIsAutoSweeping(true);
    setSliderPosition(78);
    const t1 = window.setTimeout(() => {
      setSliderPosition(34);
    }, 120);
    const t2 = window.setTimeout(() => {
      setIsSmoothAnimating(false);
      setIsAutoSweeping(false);
    }, 1050);
    sweepTimeoutsRef.current.push(t1, t2);
  };

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const rawPercent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(2, Math.min(98, rawPercent));
      setSliderPosition(clamped);
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on hotspot buttons inside the slider
    if ((e.target as HTMLElement).closest("[data-hotspot-btn]")) {
      return;
    }
    clearSweepTimers();
    setIsSmoothAnimating(false);
    setIsAutoSweeping(false);
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIsSmoothAnimating(false);
      setSliderPosition((p) => Math.max(2, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setIsSmoothAnimating(false);
      setSliderPosition((p) => Math.min(98, p + 5));
    }
  };

  return (
    <section id="antes-depois" className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-brand-700 font-bold text-sm uppercase tracking-widest">
            Resultados que se veem
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-slate-950">
            Antes e depois da higienização
          </h2>
          <p className="mt-3 text-slate-600">
            Arraste o divisor ou simule a limpeza para ver a remoção de manchas, ácaros e o restauro da cor original em cada superfície.
          </p>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {CONFIG.comparisons.map((item, idx) => {
            const active = idx === currentIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectComparison(idx)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-brand-600 text-white shadow-soft"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                <span>0{idx + 1}.</span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Showcase Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 bg-slate-950">
          {/* Top Progress & Controls Bar */}
          <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-400 pulse-dot"></span>
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  Área higienizada visível:
                </span>
                <span className="font-mono font-bold text-sm sm:text-base text-brand-300 tabular-nums">
                  {cleanPercentage}%
                </span>
              </div>
              <div className="hidden sm:block w-28 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-300 rounded-full transition-all duration-300"
                  style={{ width: `${cleanPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => triggerSmoothPosition(90)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  sliderPosition > 75 && !isAutoSweeping
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Antes
              </button>
              <button
                type="button"
                onClick={() => triggerSmoothPosition(50)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  sliderPosition >= 30 && sliderPosition <= 75 && !isAutoSweeping
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                50 / 50
              </button>
              <button
                type="button"
                onClick={() => triggerSmoothPosition(8)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  sliderPosition < 30 && !isAutoSweeping
                    ? "bg-brand-500 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Depois
              </button>
              <button
                type="button"
                onClick={runExtractionDemo}
                className="ml-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                title="Reproduzir transição suave de limpeza"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Simular limpeza</span>
              </button>
            </div>
          </div>

          {/* Comparison Viewport */}
          <div
            id="comparisonSlider"
            ref={containerRef}
            key={mediaFadeKey}
            role="slider"
            tabIndex={0}
            aria-label="Comparador antes e depois da limpeza"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={cleanPercentage}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            className="comparison-media-fade relative aspect-[16/10] sm:aspect-[16/8.5] select-none overflow-hidden cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {/* SVG Procedural Filter Definition for Realistic Organic Fabric Stains */}
            <svg className="sr-only" aria-hidden="true">
              <defs>
                <filter id="organic-stain-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.045"
                    numOctaves="4"
                    seed="7"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="26"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="displaced"
                  />
                  <feGaussianBlur in="displaced" stdDeviation="6" />
                </filter>
                <pattern id="dust-grain" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="12" cy="18" r="1.1" fill="rgba(55, 40, 24, 0.22)" />
                  <circle cx="42" cy="11" r="0.9" fill="rgba(55, 40, 24, 0.18)" />
                  <circle cx="28" cy="44" r="1.3" fill="rgba(45, 32, 18, 0.20)" />
                  <circle cx="51" cy="39" r="0.8" fill="rgba(55, 40, 24, 0.16)" />
                  <circle cx="8" cy="52" r="1.0" fill="rgba(55, 40, 24, 0.20)" />
                </pattern>
              </defs>
            </svg>

            {/* =====================================================
                1. AFTER LAYER (DEPOIS - 100% CLEAN & SANITIZED)
               ===================================================== */}
            <div id="comparisonAfter" className="absolute inset-0 w-full h-full">
              <img
                id="comparisonAfterImg"
                src={currentItem.image}
                alt={`Depois da limpeza: ${currentItem.title}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover after-surface-filter loaded"
              />
              {/* Subtle fresh ambient glow on the cleaned side */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 60% 45%, rgba(255, 255, 255, 0.14), transparent 65%)"
                }}
              />

              {/* DEPOIS Badge */}
              <div className="absolute top-4 right-4 z-20 bg-brand-700/95 backdrop-blur-md text-white rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-lg border border-brand-400/30 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4L19 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>DEPOIS · HIGIENIZADO</span>
              </div>

              {/* Bottom-Right After Note */}
              <div className="hidden sm:flex absolute bottom-4 right-4 z-20 max-w-xs bg-slate-950/75 backdrop-blur-md text-white rounded-xl px-3.5 py-2 text-xs border border-white/15 items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-100 leading-snug">{currentItem.afterNotes}</span>
              </div>
            </div>

            {/* =====================================================
                2. BEFORE LAYER (ANTES - SOILED, STAINED & DULL)
                Uses clip-path so both images align 100% pixel-for-pixel
               ===================================================== */}
            <div
              id="comparisonBefore"
              className={`absolute inset-0 w-full h-full select-none ${
                isSmoothAnimating ? "slider-smooth-transition" : ""
              }`}
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
              }}
            >
              <img
                id="comparisonBeforeImg"
                src={currentItem.image}
                alt={`Antes da limpeza: ${currentItem.title}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover before-surface-filter loaded"
              />

              {/* Multi-layered Realistic Dirt, Grime & Organic Stain Map */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ mixBlendMode: "multiply" }}
              >
                {/* General surface dullness & embedded dust */}
                <rect x="0" y="0" width="100" height="100" fill="rgba(78, 60, 40, 0.22)" />
                <rect x="0" y="0" width="100" height="100" fill="url(#dust-grain)" />

                {/* Localized Organic Stains & Traffic Wear Zones */}
                <g filter="url(#organic-stain-filter)">
                  {currentItem.stains.map((stain) => (
                    <g
                      key={stain.id}
                      transform={`rotate(${stain.rotation} ${stain.x} ${stain.y})`}
                    >
                      {/* Outer halo ring of liquid/organic stain */}
                      <ellipse
                        cx={stain.x}
                        cy={stain.y}
                        rx={stain.rx * 1.25}
                        ry={stain.ry * 1.25}
                        fill={stain.color}
                        fillOpacity={stain.opacity * 0.55}
                      />
                      {/* Core concentrated stain */}
                      <ellipse
                        cx={stain.x}
                        cy={stain.y}
                        rx={stain.rx}
                        ry={stain.ry}
                        fill={stain.color}
                        fillOpacity={stain.opacity}
                      />
                      {/* Irregular secondary splatter/wear */}
                      <ellipse
                        cx={stain.x + stain.rx * 0.35}
                        cy={stain.y - stain.ry * 0.25}
                        rx={stain.rx * 0.65}
                        ry={stain.ry * 0.7}
                        fill="#3b2816"
                        fillOpacity={stain.opacity * 0.75}
                      />
                    </g>
                  ))}
                </g>
              </svg>

              {/* Vignette darkening on Before side */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 45% 55%, rgba(62, 43, 24, 0.18), rgba(28, 20, 12, 0.42))"
                }}
              />

              {/* ANTES Badge */}
              <div className="absolute top-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md text-amber-200 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-lg border border-amber-400/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>ANTES · COM SUJIDADE E MANCHAS</span>
              </div>

              {/* Bottom-Left Before Note */}
              <div className="hidden sm:flex absolute bottom-4 left-4 z-20 max-w-xs bg-slate-950/80 backdrop-blur-md text-slate-200 rounded-xl px-3.5 py-2 text-xs border border-white/10 items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="leading-snug">{currentItem.beforeNotes}</span>
              </div>
            </div>

            {/* =====================================================
                3. INTERACTIVE INSPECTION HOTSPOTS (BEFORE vs AFTER)
               ===================================================== */}
            {showHotspots &&
              currentItem.stains.map((stain, i) => {
                // If sliderPosition < stain.x, the clean "After" layer is currently revealed at this stain's X coordinate!
                const isCleaned = sliderPosition < stain.x;
                const isSelected = activeHotspot === stain.id;

                return (
                  <div
                    key={stain.id}
                    style={{ left: `${stain.x}%`, top: `${stain.y}%` }}
                    className="absolute z-25 -translate-x-1/2 -translate-y-1/2"
                  >
                    <button
                      type="button"
                      data-hotspot-btn="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHotspot(isSelected ? null : stain.id);
                      }}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 shadow-lg cursor-pointer ${
                        isCleaned
                          ? "bg-emerald-600/95 text-white border border-emerald-300/50 scale-95"
                          : "bg-amber-950/90 text-amber-100 border border-amber-400/50 hover:scale-105"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCleaned ? "bg-white" : "bg-amber-400 animate-ping"
                        }`}
                      />
                      <span className="hidden md:inline whitespace-nowrap">
                        {isCleaned ? "✓ Removido" : `Mancha ${i + 1}`}
                      </span>
                    </button>

                    {/* Tooltip Card when Hotspot is clicked */}
                    {isSelected && (
                      <div
                        data-hotspot-btn="true"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-slate-950/95 text-white text-xs shadow-2xl border border-white/15 z-30"
                      >
                        <div className="font-display font-bold text-brand-300 flex items-center justify-between">
                          <span>{stain.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white">
                            {isCleaned ? "Limpo" : "Antes"}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-300 leading-relaxed">{stain.detail}</p>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* =====================================================
                4. SLIDER DIVIDER LINE & EXTRACTION BEAM
               ===================================================== */}
            <div
              id="comparisonHandle"
              className={`slider-handle absolute top-0 bottom-0 z-30 w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.9)] ${
                isSmoothAnimating ? "slider-smooth-transition" : ""
              }`}
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Glowing extraction water-vac beam during active drag or auto-sweep */}
              <div
                className={`absolute top-0 bottom-0 -left-8 w-8 extraction-beam pointer-events-none transition-opacity duration-300 ${
                  isAutoSweeping || isDragging ? "opacity-100" : "opacity-40"
                }`}
              />

              {/* Center Drag Handle Knob */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-2xl border-2 border-brand-500 flex items-center justify-center text-brand-700 transition-transform duration-200 ${
                  isDragging ? "scale-110 ring-4 ring-brand-400/40" : "hover:scale-105"
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 5l-5 7 5 7M16 5l5 7-5 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Info & Action Bar */}
          <div className="p-4 sm:p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="comparisonTitle" className="font-display font-extrabold text-xl text-slate-900">
                  {currentItem.title}
                </h3>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span id="comparisonDescription" className="text-sm font-semibold text-brand-700">
                  {currentItem.subtitle}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                {currentItem.description}
              </p>

              {/* Unboxed clean metadata metrics */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                <span className="text-slate-700">{currentItem.metrics.stainRemoval}</span>
                <span aria-hidden="true">·</span>
                <span>{currentItem.metrics.odorElimination}</span>
                <span aria-hidden="true">·</span>
                <span>{currentItem.metrics.dryingTime}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowHotspots((v) => !v)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap"
              >
                {showHotspots ? "Ocultar pontos de mancha" : "Mostrar pontos de mancha"}
              </button>

              <a
                href="#orcamento"
                onClick={() => onSelectServiceForQuote(currentItem.serviceId)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-soft transition flex items-center gap-2 whitespace-nowrap"
              >
                <span>Orçar {currentItem.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
