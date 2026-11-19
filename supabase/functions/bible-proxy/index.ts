const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const version = url.searchParams.get('version')
  const bookId = url.searchParams.get('bookId')
  const chapter = url.searchParams.get('chapter')

  if (!version || !bookId || !chapter) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await fetch(`https://bolls.life/get-text/${version}/${bookId}/${chapter}/`)
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Bible version or chapter not found' }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    if (!Array.isArray(data)) {
      return new Response(JSON.stringify({ error: 'Invalid response from Bible provider' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Texto bíblico não muda: o navegador guarda por 1 dia e poupa pedidos ao bolls.life (que responde 429 quando
    // recebe muitos de uma vez). Lista vazia não vai para o cache (o app trata como erro e tenta de novo).
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(data.length > 0 ? { 'Cache-Control': 'public, max-age=86400' } : {}) },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch bible text' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
