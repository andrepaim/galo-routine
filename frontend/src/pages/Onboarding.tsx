import { useState } from 'react';
import { useAuthStore } from '../lib/stores/authStore';

function hashPin(pin: string): string {
  let hash = 0;
  const str = `star-routine-pin-${pin}-salt`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export default function Onboarding() {
  const { createFamily, googleUser } = useAuthStore();
  const [parentName, setParentName] = useState(googleUser?.name?.split(' ')[0] ?? '');
  const [childName, setChildName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length < 4) return setError('PIN deve ter pelo menos 4 dígitos');
    if (pin !== pinConfirm) return setError('PINs não coincidem');
    setLoading(true);
    try {
      await createFamily(parentName, childName, hashPin(pin));
    } catch (err: any) {
      setError(err.message || 'Erro ao criar família');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#f9fafb',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111827',
      padding: 24,
    }}>
      <div style={{
        background: '#1f2937',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚽</div>
          <h2 style={{ color: '#FFCC00', fontSize: 22, fontWeight: 800, margin: 0 }}>
            Configure sua família
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 6 }}>
            Bem-vindo, {googleUser?.name?.split(' ')[0]}! Vamos configurar sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Seu nome (responsável)
            </label>
            <input
              style={inputStyle}
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              placeholder="Ex: André"
              required
            />
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Nome da criança
            </label>
            <input
              style={inputStyle}
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Ex: Vitor"
              required
            />
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              PIN da criança (para entrar na tela deles)
            </label>
            <input
              style={inputStyle}
              type="number"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Ex: 1234"
              maxLength={8}
              required
            />
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Confirme o PIN
            </label>
            <input
              style={inputStyle}
              type="number"
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value)}
              placeholder="Repita o PIN"
              required
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>⚠️ {error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#374151' : '#FFCC00',
              color: loading ? '#9ca3af' : '#111827',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
          >
            {loading ? 'Criando...' : 'Criar família 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
