'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { User, SKILL_LEVEL_LABELS } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Card, Input, Button } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get, patch } = useApi();
  const router = useRouter();
  const t = useTranslations('profile');
  const tc = useTranslations('common');

  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({ name: '', bio: '', avatarUrl: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    try {
      const data = await get<User>('/api/v1/users/me', { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      setProfile(data);
      setFormData({
        name: data.name || '',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await patch('/api/v1/users/me', formData, { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{t('notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{profile.name || profile.email}</h1>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="secondary">
                {t('editProfile')}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 mb-6">
              <Input
                label={t('name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label={t('avatarUrl')}
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              />
              <Input
                label={t('bio')}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('bioPlaceholder')}
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} variant="primary" isLoading={isSaving}>
                  {t('save')}
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="secondary">
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-500 mb-2">{profile.email}</p>
              {profile.bio && <p className="text-gray-600 mb-6">{profile.bio}</p>}
            </>
          )}

          {profile.sportStats && profile.sportStats.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('sportStats')}</h2>
              <div className="space-y-3">
                {profile.sportStats.map((stat) => (
                  <div key={stat.sportId} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{stat.sportId}</p>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <p className="text-gray-500">{t('statMatches')}</p>
                        <p className="font-bold">{stat.matchesPlayed}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('statWon')}</p>
                        <p className="font-bold">{stat.matchesWon}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('statRanking')}</p>
                        <p className="font-bold">{stat.rankingPoints} pts</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-gray-500">{t('statLevel')}</p>
                        <p className="font-bold text-green-600">
                          {SKILL_LEVEL_LABELS[stat.level] || stat.level}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
