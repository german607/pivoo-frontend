'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui';
import { useRouter } from '@/navigation';
import { Check } from 'lucide-react';

const INPUT_CLS = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500';
const SELECT_CLS = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500';
const LABEL_CLS = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2';

const PRESET_COLORS = [
  '#14B8A6', '#0EA5E9', '#6366F1', '#8B5CF6',
  '#EC4899', '#F43F5E', '#F97316', '#EAB308',
  '#22C55E', '#64748B', '#FFFFFF', '#1E293B',
];

interface Sport { id: string; name: string }

export default function NewTeamPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get, post } = useApi();
  const router = useRouter();

  const [sports, setSports] = useState<Sport[]>([]);
  const [name, setName] = useState('');
  const [sportId, setSportId] = useState('');
  const [color, setColor] = useState('#14B8A6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL })
      .then((data) => setSports(data || []))
      .catch(() => {});
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const team = await post<{ id: string }>('/api/v1/teams', {
        name: name.trim(),
        ...(sportId ? { sportId } : {}),
        color,
      }, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL });
      router.push(`/teams/${team.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el equipo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <main className="max-w-lg mx-auto px-5 py-12">
        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 shadow-[0_2px_16px_rgba(0,0,0,0.4)] overflow-hidden">

          <div className="h-1 bg-gradient-to-r from-teal-400 to-blue-500" />

          <div className="px-7 pt-7 pb-6">
            <h1 className="text-xl font-black text-white">Crear equipo</h1>
            <p className="text-sm text-slate-400 mt-1">Los campos marcados son obligatorios.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-6">

            {/* Preview */}
            <div className="flex items-center gap-4 p-4 bg-slate-700/40 rounded-xl border border-slate-700">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow shrink-0 transition-all duration-200"
                style={{ background: color }}
              >
                {name.trim() ? name.trim().slice(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <p className="text-base font-bold text-white">{name.trim() || 'Nombre del equipo'}</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  {sportId ? (sports.find((s) => s.id === sportId)?.name ?? '') : 'Todos los deportes'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className={LABEL_CLS}>Nombre <span className="text-teal-400">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Ej. "Los Invencibles"'
                maxLength={50}
                className={INPUT_CLS}
                required
              />
              <p className="text-xs text-slate-600 mt-1 text-right">{name.length}/50</p>
            </div>

            {/* Sport */}
            <div>
              <label className={LABEL_CLS}>Deporte</label>
              <select
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">Todos los deportes</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className={LABEL_CLS}>Color del equipo</label>
              <div className="grid grid-cols-6 gap-2.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="relative w-full aspect-square rounded-xl border-2 transition-all duration-150"
                    style={{
                      background: c,
                      borderColor: color === c ? 'white' : 'transparent',
                      boxShadow: color === c ? '0 0 0 2px rgba(255,255,255,0.2)' : 'none',
                    }}
                  >
                    {color === c && (
                      <Check
                        className="absolute inset-0 m-auto w-4 h-4 drop-shadow"
                        style={{ color: c === '#FFFFFF' || c === '#EAB308' ? '#1e293b' : 'white' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1">
                Crear equipo
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
