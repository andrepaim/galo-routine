import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/stores/authStore';
import { GaloBadge } from '../components/galo/GaloBadge';
import { PIN_LENGTH } from '../constants';

export default function ParentPin() {
  const navigate = useNavigate();
  const checkChildPin = useAuthStore((s) => s.checkChildPin);
  const setRole = useAuthStore((s) => s.setRole);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = useCallback(
    async (digit: string) => {
      navigator.vibrate?.(30);
      setError('');
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        setLoading(true);
        try {
          const valid = await checkChildPin(newPin);
          if (valid) {
            navigator.vibrate?.([50, 30, 50]);
            await setRole('parent');
            navigate('/parent', { replace: true });
          } else {
            navigator.vibrate?.([100, 50, 100]);
            setError('PIN errado. Tenta de novo!');
            setPin('');
          }
        } catch {
          setError('Algo deu errado');
          setPin('');
        } finally {
          setLoading(false);
        }
      }
    },
    [pin, checkChildPin, setRole, navigate],
  );

  const handleDelete = useCallback(() => {
    navigator.vibrate?.(30);
    setPin((p) => p.slice(0, -1));
    setError('');
  }, []);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen bg-galo-black flex flex-col items-center justify-center safe-top px-6">
      {/* Header */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div
          className="rounded-full bg-star-gold flex items-center justify-center mb-4"
          style={{
            width: 112,
            height: 112,
            boxShadow: '0 0 32px rgba(255,215,0,0.45), 0 0 8px rgba(255,215,0,0.3)',
          }}
        >
          <GaloBadge size={70} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Área dos Pais</h2>
        <p className="text-text-secondary mt-1">Digite o PIN para continuar</p>
      </div>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-[3px] transition-all ${
              i < pin.length
                ? error
                  ? 'bg-accent-red border-accent-red'
                  : 'bg-star-gold border-star-gold'
                : error
                ? 'border-accent-red bg-transparent'
                : 'border-star-gold bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      <div className="h-7 flex items-center justify-center mb-4">
        {error && <p className="text-accent-red text-sm font-medium">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-72">
        {digits.map((d, i) => {
          if (d === '') {
            return <div key={i} />;
          }
          if (d === 'del') {
            return (
              <button
                key={i}
                onClick={handleDelete}
                disabled={pin.length === 0}
                className="h-16 flex items-center justify-center rounded-2xl text-2xl text-text-primary disabled:text-text-muted active:scale-95 transition-transform"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              disabled={loading || pin.length >= PIN_LENGTH}
              className="h-16 flex items-center justify-center rounded-2xl bg-card-bg border border-card-border text-2xl font-bold text-text-primary hover:bg-star-gold/20 active:bg-star-gold active:text-galo-black transition-all disabled:opacity-50"
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Back */}
      <button
        onClick={() => navigate('/child', { replace: true })}
        className="mt-10 text-star-gold text-sm font-medium hover:underline"
      >
        Voltar
      </button>
    </div>
  );
}
