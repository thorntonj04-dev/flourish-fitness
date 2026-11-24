import React from 'react';
import { X, ExternalLink } from 'lucide-react';

// Plays an exercise demo in-app. YouTube links embed; anything else (e.g. an uploaded
// video file) plays in a <video> tag. "Open in YouTube" is the fallback if embedding fails.
export default function ExerciseVideoModal({ name, video, onClose }) {
  if (!video) return null;
  const isFile = !video.youTubeId;
  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#1E3328] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h3 className="font-bold text-gray-900 dark:text-[#d8e7de] break-words min-w-0">{name}</h3>
          <button
            onClick={onClose}
            aria-label="Close video"
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/70" />
          </button>
        </div>
        <div className="relative w-full bg-black" style={{ aspectRatio: '9 / 16', maxHeight: '65svh' }}>
          {isFile ? (
            <video src={video.url} controls autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
          ) : (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youTubeId}?autoplay=1&playsinline=1&rel=0&loop=1&playlist=${video.youTubeId}`}
              title={`${name} demo`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>
        {!isFile && (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-gray-500 dark:text-[#d8e7de]/60"
          >
            <ExternalLink className="w-4 h-4" /> Open in YouTube
          </a>
        )}
      </div>
    </div>
  );
}
