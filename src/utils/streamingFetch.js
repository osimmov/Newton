/**
 * Streaming fetch: reads a text/plain streaming response and calls `onChunk`
 * with each piece of text as it arrives. Returns the full accumulated text.
 *
 * The proxy streams raw text (not JSON) for success, or returns JSON with a
 * non-200 status for errors. Errors are always thrown before any chunks arrive.
 */
export async function fetchStreaming({ url, body, signal, onChunk }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    let msg = `Proxy error: ${res.status}`
    try {
      const data = await res.json()
      if (data.error) msg = data.error
    } catch { /* plain-text or unparseable body */ }
    throw new Error(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    accumulated += chunk
    onChunk(accumulated)
  }

  return accumulated
}
