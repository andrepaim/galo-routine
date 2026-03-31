let _es: EventSource | null = null;
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function getSSE(): EventSource {
  if (!_es || _es.readyState === EventSource.CLOSED) {
    if (_es) {
      _es.close(); // clean up old instance
    }
    _es = new EventSource('/api/events');

    _es.onerror = () => {
      // If stuck in CONNECTING for too long, force reconnect
      if (_reconnectTimer) clearTimeout(_reconnectTimer);
      _reconnectTimer = setTimeout(() => {
        if (_es && _es.readyState !== EventSource.OPEN) {
          _es.close(); // forces readyState to CLOSED, next getSSE() recreates
          _es = null;
        }
      }, 10000); // 10s timeout before forcing reconnect
    };

    _es.addEventListener('open', () => {
      // Clear any pending reconnect timer on successful connection
      if (_reconnectTimer) {
        clearTimeout(_reconnectTimer);
        _reconnectTimer = null;
      }
    });
  }
  return _es;
}
