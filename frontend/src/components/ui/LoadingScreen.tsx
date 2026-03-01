import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-galo-black flex flex-col items-center justify-center gap-4">
      <span className="text-5xl animate-pulse">⭐</span>
      <p className="text-text-secondary text-sm">{message}</p>
    </div>
  );
}
