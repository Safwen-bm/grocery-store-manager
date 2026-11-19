import axios from 'axios';

// Same origin (Vite proxy in dev, wwwroot in prod): the HttpOnly cookie is sent automatically.
export const api = axios.create({ baseURL: '/api' });

export function errorMessage(err, fallback = 'حدث خطأ غير متوقع') {
  const data = err?.response?.data;
  if (err?.response?.status === 429) return 'محاولات كثيرة، حاول مرة أخرى بعد دقيقة';
  if (data?.errors) return Object.values(data.errors).flat().join(' - ');
  return data?.message || err?.message || fallback;
}
