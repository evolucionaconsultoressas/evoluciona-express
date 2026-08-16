export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { system, messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Faltan mensajes' });
  }

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
