#!/bin/bash
# Custom entrypoint for Kong that builds Lua expressions for request-transformer
# and performs environment variable substitution in the declarative config.

# Build Lua expressions for translating API keys
export LUA_AUTH_EXPR="\$((headers.authorization ~= nil and headers.authorization) or headers.apikey)"
export LUA_RT_WS_EXPR="\$(query_params.apikey)"

# Substitute environment variables in the Kong declarative config.
awk '{
  result = ""
  rest = $0
  while (match(rest, /\$[A-Za-z_][A-Za-z_0-9]*/)) {
    varname = substr(rest, RSTART + 1, RLENGTH - 1)
    if (varname in ENVIRON) {
      result = result substr(rest, 1, RSTART - 1) ENVIRON[varname]
    } else {
      result = result substr(rest, 1, RSTART + RLENGTH - 1)
    }
    rest = substr(rest, RSTART + RLENGTH)
  }
  print result rest
}' /home/kong/temp.yml > "$KONG_DECLARATIVE_CONFIG"

# Start Kong in background
/entrypoint.sh kong docker-start &
KONG_PID=$!

# Wait for nginx-kong.conf to be generated (max 30 seconds)
for i in {1..30}; do
  if [ -f /usr/local/kong/nginx-kong.conf ]; then
    # Inject large_client_header_buffers at the beginning
    if ! grep -q "large_client_header_buffers" /usr/local/kong/nginx-kong.conf; then
      sed -i '1s/^/large_client_header_buffers 8 16k;\n/' /usr/local/kong/nginx-kong.conf
      # Reload Kong to apply changes
      sleep 2
      kill -HUP $KONG_PID 2>/dev/null || true
    fi
    break
  fi
  sleep 1
done

# Wait for Kong process
wait $KONG_PID
