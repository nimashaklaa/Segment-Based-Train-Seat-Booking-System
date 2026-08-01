#!/bin/sh
set -e

# Write runtime env vars into env.js so the browser can read them.
cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV__ = {
  API_URL: '${API_URL:-http://localhost:3000}',
};
EOF

exec nginx -g 'daemon off;'
