const jsonHeaders = {
  'Content-Type': 'application/json',
};

// Determinar URL del backend:
// - Modo dev (vite): usa variable de entorno o puerto 8888
// - Modo producción (nginx): usa rutas relativas (proxy maneja /api)
const getApiUrl = () => {
  // Si Vite inyectó VITE_BACKEND_URL, úsala
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.trim().replace(/\/$/, '')
  }
  
  // Si estamos en localhost, usa 8888
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8888'
  }
  
  // Producción: rutas relativas (nginx proxy)
  return ''
}

const apiUrl = getApiUrl()

function parseRoleToBackend(role) {
  if (!role) return 'agronomo'

  const normalized = role.toLowerCase()
  if (normalized.includes('admin')) return 'admin'
  if (normalized.includes('inversion')) return 'inversionista'
  return 'agronomo'
}

function parseRoleFromBackend(role) {
  if (!role) return 'Usuario'

  if (role === 'admin') return 'Administrador'
  if (role === 'inversionista') return 'Inversionista'
  if (role === 'agronomo') return 'Agrónomo'
  return role
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No se pudo completar la solicitud de autenticación.')
  }

  return data
}

export async function loginUser(credentials) {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      email: credentials.email,
      contrasena: credentials.password,
    }),
  });

  const data = await parseJsonResponse(response);

  return {
    token: data.access_token,
    user: {
      id: data.usuario?.id,
      name: data.usuario?.nombre || 'Usuario',
      email: data.usuario?.email || credentials.email,
      role: parseRoleFromBackend(data.usuario?.rol),
      backendRole: data.usuario?.rol,
    },
  };
}

export async function registerUser(payload) {
  const response = await fetch(`${apiUrl}/api/auth/registro`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      nombre: payload.name,
      email: payload.email,
      rol: parseRoleToBackend(payload.role),
      contrasena: payload.password,
      num_telefono: payload.phone || null,
    }),
  });

  const data = await parseJsonResponse(response);

  return {
    user: {
      id: data.id,
      name: data.nombre || payload.name,
      email: data.email || payload.email,
      role: parseRoleFromBackend(data.rol),
      backendRole: data.rol,
    },
  };
}