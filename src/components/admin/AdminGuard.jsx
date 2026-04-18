import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AdminGuard({ children }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.role !== 'admin') {
        navigate('/');
      } else {
        setAuthorized(true);
      }
    }).catch(() => navigate('/')).finally(() => setChecking(false));
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return authorized ? children : null;
}