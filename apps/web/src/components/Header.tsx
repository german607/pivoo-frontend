'use client';

import { useAuth } from '@/contexts/auth';
import { Link, useRouter, usePathname } from '@/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { UserRole } from '@pivoo/shared';

export function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('header');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: nextLocale });
  };

  const navLinks = [
    { href: '/matches', label: t('matches') },
    { href: '/tournaments', label: t('tournaments') },
    { href: '/rankings', label: t('rankings') },
    ...(user?.role === UserRole.PLAYER ? [{ href: '/teams', label: t('myTeam') }] : []),
    ...(user?.role === UserRole.COMPLEX ? [{ href: '/complex', label: t('myComplex') }] : []),
    ...(user ? [{ href: '/profile', label: t('profile') }] : []),
  ];

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
              <span className="text-white font-black text-base leading-none select-none">P</span>
            </div>
            <span className="font-bold text-xl text-white hidden sm:inline tracking-tight">
              Pivoo
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: lang + auth */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleLocale}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white border border-white/15 hover:border-white/30 rounded-md transition-all duration-150"
              title={t('switchLang')}
            >
              {t('switchLang')}
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{user.email.split('@')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-all duration-150"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-150"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-400 rounded-lg transition-all duration-150 shadow-lg shadow-teal-500/25"
                >
                  {t('signUp')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/8 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/8 pt-3 mt-3 space-y-2">
              <button
                onClick={toggleLocale}
                className="block w-full text-left px-3 py-2.5 text-sm font-bold text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                {t('switchLang')}
              </button>
              {user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white text-center rounded-lg transition-colors"
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-400 text-center rounded-lg transition-colors"
                  >
                    {t('signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
