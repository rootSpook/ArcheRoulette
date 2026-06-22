import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      setError('Invalid credentials');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '6rem auto', padding: '2rem', border: '1px solid #eee' }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <input name="username" placeholder="Username" required />
        <input name="password" type="password" placeholder="Password" required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
