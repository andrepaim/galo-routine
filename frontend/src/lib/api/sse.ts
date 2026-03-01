let _es: EventSource | null = null;

export function getSSE(): EventSource {
  if (!_es || _es.readyState === EventSource.CLOSED) {
    _es = new EventSource('/api/events');
  }
  return _es;
}
