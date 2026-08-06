const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);

window.TERM_TEST_APP_CONFIG = Object.freeze({
  API_BASE_URL: isLocalPreview ? window.location.origin : 'https://ducizone.ddns.net/mapping-api'
});
