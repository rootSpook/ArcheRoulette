import { useState, useEffect, FormEvent } from 'react';
import api from '../../lib/api';
import { Settings } from '../../types/settings';
import styles from './admin.module.css';

const RESET_CONFIRM_TEXT = 'SIFIRLA';

export default function AdminAyarlar() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const [resetInput, setResetInput] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    api.get<Settings>('/admin/settings').then(({ data }) => setSettings(data));
  }, []);

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword !== confirmPassword) {
      setPwError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setPwSubmitting(true);
    try {
      await api.put('/admin/account/password', { currentPassword, newPassword });
      setPwSuccess('Şifre güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bir hata oluştu.';
      setPwError(msg);
    } finally {
      setPwSubmitting(false);
    }
  }

  async function handleSettingsSave() {
    if (!settings) return;
    setSettingsSaving(true);
    setSettingsSuccess('');
    try {
      const { data } = await api.put<Settings>('/admin/settings', {
        cooldownEnabled: settings.cooldownEnabled,
        cooldownRounds: settings.cooldownRounds,
      });
      setSettings(data);
      setSettingsSuccess('Kaydedildi ✓');
      setTimeout(() => setSettingsSuccess(''), 2000);
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleReset() {
    if (resetInput !== RESET_CONFIRM_TEXT) return;
    setResetSubmitting(true);
    setResetError('');
    try {
      await api.post('/admin/reset-all');
      setResetInput('');
      window.location.reload();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bir hata oluştu.';
      setResetError(msg);
    } finally {
      setResetSubmitting(false);
    }
  }

  return (
    <div className={styles.page} style={{ maxWidth: 520 }}>
      <h1 className={styles.title}>Ayarlar</h1>

      <div className={styles.card}>
        <p style={{ color: '#884444', fontSize: '0.85rem', marginBottom: '1rem' }}>Şifre Değiştir</p>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.row}>
            <label>Mevcut Şifre</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.row}>
            <label>Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className={styles.row}>
            <label>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" className={styles.btn} disabled={pwSubmitting}>
              {pwSubmitting ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
            </button>
            {pwSuccess && <span className={styles.success}>{pwSuccess}</span>}
            {pwError && <span style={{ color: '#e03030', fontSize: '0.85rem' }}>{pwError}</span>}
          </div>
        </form>
      </div>

      {settings && (
        <div className={styles.card}>
          <p style={{ color: '#884444', fontSize: '0.85rem', marginBottom: '1rem' }}>Oylama Ayarları</p>

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Şampiyon seçimi bekleme süresi olsun mu?</span>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.cooldownEnabled}
                onChange={(e) => setSettings({ ...settings, cooldownEnabled: e.target.checked })}
              />
              <span className={styles.slider} />
            </label>
          </div>

          {settings.cooldownEnabled && (
            <div className={styles.row} style={{ marginTop: '1rem' }}>
              <label>Bekleme süresi (round)</label>
              <input
                type="number"
                min={1}
                value={settings.cooldownRounds}
                onChange={(e) => setSettings({ ...settings, cooldownRounds: Number(e.target.value) })}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
            <button className={styles.btn} onClick={handleSettingsSave} disabled={settingsSaving}>
              {settingsSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            {settingsSuccess && <span className={styles.success}>{settingsSuccess}</span>}
          </div>
        </div>
      )}

      <div className={styles.card} style={{ borderColor: '#5a1010' }}>
        <p style={{ color: '#e03030', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 700 }}>
          Tehlikeli Bölge
        </p>
        <p style={{ color: '#884444', fontSize: '0.82rem', marginBottom: '1rem' }}>
          Bu işlem tüm oyları, maç geçmişini, şampiyon istatistiklerini, oylama oturumunu ve yayıncı
          rank bilgisini sıfırlar. Bu işlem geri alınamaz.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder={`Onaylamak için "${RESET_CONFIRM_TEXT}" yazın`}
            value={resetInput}
            onChange={(e) => setResetInput(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '0.45rem 0.75rem', background: '#0f0000',
              border: '1px solid #5a1010', borderRadius: 5, color: '#e8d0d0', fontSize: '0.9rem',
            }}
          />
          <button
            className={styles.btn}
            style={{ background: '#7b0000' }}
            onClick={handleReset}
            disabled={resetInput !== RESET_CONFIRM_TEXT || resetSubmitting}
          >
            {resetSubmitting ? 'Sıfırlanıyor...' : 'Her Şeyi Sıfırla'}
          </button>
        </div>
        {resetError && <p style={{ color: '#e03030', fontSize: '0.85rem', marginTop: '0.5rem' }}>{resetError}</p>}
      </div>
    </div>
  );
}
