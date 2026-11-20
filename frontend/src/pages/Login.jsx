import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(username, password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <form onSubmit={submit} className="card flex flex-col gap-4 p-6">
        <h1 className="text-center text-2xl font-bold">تسجيل الدخول للإدارة</h1>
        <Field label="اسم المستخدم">
          <input className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </Field>
        <Field label="كلمة المرور">
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? '...' : 'تسجيل الدخول'}</button>
      </form>
    </div>
  );
}