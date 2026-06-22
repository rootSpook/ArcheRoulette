import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await login(form.get('username') as string, form.get('password') as string);
      navigate('/admin');
    } catch {
      setError('Kullanıcı adı veya şifre hatalı.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />
      <div className={styles.card}>
        <div className={styles.logo}>ArcheRoulette<span>Admin</span></div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="username" placeholder="Kullanıcı adı" required className={styles.input} />
          <input name="password" type="password" placeholder="Şifre" required className={styles.input} />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn}>Giriş Yap</button>
        </form>
      </div>
    </div>
  );
}
