const jsonHeaders = {
  'Content-Type': 'application/json',
}

// Determina la URL base del backend según el entorno:
// - Render: usa rutas relativas (/api/...) — nginx proxy maneja el ruteo
// - localhost: apunta al backend local en puerto 8888
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    console.log('Current hostname:', hostname)

    // En localhost apuntar al backend local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('Detectado localhost: usando http://localhost:8888')
      return 'http://localhost:8888'
    }

    // En cualquier dominio en la nube (Render, Railway, etc.)
    // usar rutas relativas — nginx proxy redirige /api/ al backend
    console.log('Detectado dominio en la nube: usando rutas relativas')
    return ''
  }

  return 'http://localhost:8888'
}

const backendUrl = getBackendUrl()

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No se pudo completar la solicitud al backend.')
  }

  return data
}

export async function fetchBackendStatus(forceMode = 'auto') {
  if (forceMode === 'simulated') {
    return {
      status: 'mock',
      simulated: true,
      message: 'Modo demo simulado activo.',
    }
  }

  // Llamada real al backend para verificar que está disponible
  try {
    const statusUrl = backendUrl ? `${backendUrl}/` : '/backend-health'
    const response = await fetch(statusUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      return {
        status: 'ok',
        available: true,
        simulated: false,
        message: 'Backend conectado correctamente.',
      }
    }

    return {
      status: 'error',
      available: false,
      simulated: false,
      message: `Backend respondió con error ${response.status}.`,
    }
  } catch {
    return {
      status: 'offline',
      available: false,
      simulated: true,
      message: 'No se pudo conectar con el backend. Modo simulado activo.',
    }
  }
}

export async function sendTelemetry(payload, forceMode = 'auto') {
  const normalizedPayload = {
    deveui: payload.deveui,
    humedad: Number(payload.humedad),
    temperatura: Number(payload.temperatura),
    ph: Number(payload.ph),
    voltaje: Number(payload.voltaje),
  }

  // Preserve explicit agricultural fields when present so backend can write them
  // into `lecturas_cultivo` (humedad_aire / humedad_suelo).
  if (payload.humedad_aire !== undefined && payload.humedad_aire !== null) {
    normalizedPayload.humedad_aire = Number(payload.humedad_aire)
  }
  if (payload.humedad_suelo !== undefined && payload.humedad_suelo !== null) {
    normalizedPayload.humedad_suelo = Number(payload.humedad_suelo)
  }

  if (forceMode === 'simulated') {
    await wait(400)

    return {
      message: 'Telemetría simulada correctamente',
      sensor_id: `mock-${normalizedPayload.deveui}`,
      simulated: true,
      data: [
        {
          id: `telemetry-${Date.now()}`,
          ...normalizedPayload,
          created_at: new Date().toISOString(),
        },
      ],
    }
  }

  try {
    const response = await fetch(`${backendUrl}/api/telemetry`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(normalizedPayload),
    })

    const data = await parseJsonResponse(response)
    return {
      ...data,
      simulated: false,
    }
  } catch {
    if (forceMode === 'real') {
      throw new Error('No se pudo conectar con el backend real.')
    }

    await wait(700)

    return {
      message: 'Telemetría simulada correctamente',
      sensor_id: `mock-${normalizedPayload.deveui}`,
      simulated: true,
      data: [
        {
          id: `telemetry-${Date.now()}`,
          ...normalizedPayload,
          created_at: new Date().toISOString(),
        },
      ],
    }
  }
}