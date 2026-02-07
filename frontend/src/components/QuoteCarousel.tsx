import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BUFFETT_QUOTES, type BuffettQuote } from '../assets/buffettQuotes';

type QuoteCarouselProps = {
  intervalMs?: number;
  random?: boolean;
};

function pickNextIndex(current: number, length: number, random: boolean): number {
  if (length <= 1) return 0;
  if (!random) return (current + 1) % length;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}

export function QuoteCarousel({ intervalMs = 2500, random = false }: QuoteCarouselProps) {
  const quotes: BuffettQuote[] = useMemo(() => BUFFETT_QUOTES, []);
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const indexRef = useRef(index);
  const isFadingRef = useRef(isFading);
  const isPausedRef = useRef(isPaused);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    isFadingRef.current = isFading;
  }, [isFading]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const showIndex = (nextIndex: number) => {
    if (quotes.length === 0) return;
    if (isFadingRef.current) return;
    setIsFading(true);
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = window.setTimeout(() => {
      setIndex(nextIndex);
      setIsFading(false);
    }, 220);
  };

  const showPrev = () => {
    if (quotes.length === 0) return;
    const nextIndex = (indexRef.current - 1 + quotes.length) % quotes.length;
    showIndex(nextIndex);
  };

  const showNext = () => {
    if (quotes.length === 0) return;
    const nextIndex = pickNextIndex(indexRef.current, quotes.length, random);
    showIndex(nextIndex);
  };

  useEffect(() => {
    if (quotes.length <= 1) return;
    if (intervalMs <= 0) return;

    const timer = window.setInterval(() => {
      if (isPausedRef.current) return;
      showNext();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, quotes.length, random]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') showPrev();
      if (event.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [random, quotes.length]);

  const current = quotes[index] ?? null;

  return (
    <div
      className="border-2 border-slate-200 rounded-lg bg-slate-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,0.08)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-xs font-bold uppercase text-slate-500">巴菲特语录</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={showPrev}
            className="p-2 bg-white border-2 border-slate-200 rounded hover:border-slate-400"
            aria-label="Previous quote"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={showNext}
            className="p-2 bg-white border-2 border-slate-200 rounded hover:border-slate-400"
            aria-label="Next quote"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        {current ? (
          <>
            <div className="text-sm leading-relaxed text-ink font-serif text-center">
              {`“${current.text}”`}
            </div>
            <div className="mt-3 text-xs text-slate-500 italic text-center">
              {current.source} ({current.year})
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500">No quotes loaded.</div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-slate-500 text-center">
        {quotes.length > 0 ? `第 ${index + 1} 条 / 共 ${quotes.length} 条` : ''}
      </div>
    </div>
  );
}
