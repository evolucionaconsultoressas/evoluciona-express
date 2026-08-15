// Este archivo vive en /api/chat.js — Vercel lo convierte automáticamente
// en un endpoint serverless: https://tu-dominio.vercel.app/api/chat
//
// Su único trabajo es recibir la conversación desde index.html, agregar
// la API key de Anthropic (que SOLO vive aquí, del lado del servidor,
// nunca en el navegador del usuario) y devolver la respuesta de Claude.

export default async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { system, messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Faltan mensajes' });
  }

  // Guardas básicas anti-abuso: evita conversaciones eternas o mensajes gigantes
  if (messages.length > 40) {
    return res.status(400).json({ error: 'Conversación demasiado larga, inicia una nueva' });
  }
  const totalChars = messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0), 0);
  if (totalChars > 20000) {
    return res.status(400).json({ error: 'Mensaje demasiado largo' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: system || '',
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Anthropic API:', data);
      return res.status(response.status).json({ error: 'Error al contactar la IA' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
