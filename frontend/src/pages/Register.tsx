/**
 * Register.tsx — disabled for single-family app.
 * Redirects to parent view.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/parent', { replace: true });
  }, [navigate]);
  return null;
}
