'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({
  id = 'btn-toggle-theme',
  className = '',
  size = 16,
}) {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme =
      document.documentElement.getAttribute('data-theme') ||
      localStorage.getItem('theme') ||
      'dark';
    setTheme(initialTheme);

    const handleCustomChange = (e) => {
      if (e.detail) {
        setTheme(e.detail);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };

    window.addEventListener('theme-change', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('theme-change', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      id={id}
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {mounted ? (
        isDark ? (
          <Sun size={size} className="theme-toggle-icon" />
        ) : (
          <Moon size={size} className="theme-toggle-icon" />
        )
      ) : (
        <Sun size={size} className="theme-toggle-icon" />
      )}
    </button>
  );
}
