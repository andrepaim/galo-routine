import React from 'react';
import type { GaloNewsItem } from '../../lib/types';
import { GaloBadge } from './GaloBadge';

interface Props {
  news: GaloNewsItem;
  onClose: () => void;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'agora';
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? 's' : ''}`;
}

export function GaloNewsCard({ news, onClose }: Props) {
  // Don't show summary if it's identical (or near-identical) to the title
  const showSummary =
    news.summary &&
    news.summary.trim().toLowerCase() !== news.title.trim().toLowerCase() &&
    news.summary.length > 20;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-end justify-center z-50 p-4 pb-8 animate-fade-in">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
        style={{ border: '1px solid rgba(255,215,0,0.25)' }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] h-40 flex flex-col items-center justify-center gap-3">
          {/* Gold ring glow */}
          <div
            className="absolute inset-0 rounded-t-2xl"
            style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(255,215,0,0.08) 0%, transparent 70%)' }}
          />
          <GaloBadge size={80} glow className="relative z-10" />
          <div className="flex items-center gap-1.5 relative z-10">
            <span className="text-sm">🏆</span>
            <span className="text-xs font-black tracking-[0.2em] uppercase text-star-gold">
              Notícias do Galo
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#111] px-5 pt-5 pb-5">
          {/* Source + date pill */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-star-gold bg-star-gold/10 px-2 py-0.5 rounded-full">
              {news.source}
            </span>
            <span className="text-[11px] text-gray-500">{relativeDate(news.publishedAt)}</span>
          </div>

          {/* Title */}
          <p className="text-[17px] font-extrabold text-white leading-snug line-clamp-4">
            {news.title}
          </p>

          {/* Summary — only when different from title */}
          {showSummary && (
            <p className="text-sm text-gray-400 leading-relaxed mt-2.5 line-clamp-3">
              {news.summary}
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-white/5 mt-4 mb-4" />

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.open(news.url, '_blank')}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#111',
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
              }}
            >
              Ler artigo completo →
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-sm active:scale-95 transition-all hover:bg-white/10"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
