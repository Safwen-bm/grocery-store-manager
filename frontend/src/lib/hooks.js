import { useEffect, useState } from 'react';
import { api, errorMessage } from './api';

// GET helper: keeps the previous data while a new request loads.
export function useApi(path, params, enabled = true) {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ key: null });
  const key = `${path}?${JSON.stringify(params ?? {})}#${reload}`;

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    api.get(path, { params })
      .then((r) => active && setState({ key, data: r.data }))
      .catch((e) => active && setState({ key, error: errorMessage(e), status: e.response?.status }));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const fresh = state.key === key;
  return {
    data: state.data,
    error: fresh ? state.error : undefined,
    status: fresh ? state.status : undefined,
    loading: enabled && !fresh,
    reload: () => setReload((n) => n + 1),
  };
}

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}