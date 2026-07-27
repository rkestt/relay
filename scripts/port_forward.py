#!/usr/bin/env python3
import socket, threading, sys, os, signal

lport = int(sys.argv[1])
rhost = sys.argv[2]
rport = int(sys.argv[3])

# Double-fork daemonize: first fork exits parent so shell returns
# Second fork prevents zombie, reparents to init
if os.fork() > 0:
    sys.exit(0)
os.setsid()
if os.fork() > 0:
    sys.exit(0)

signal.signal(signal.SIGCHLD, signal.SIG_IGN)

def pipe(s, d):
    try:
        while True:
            b = s.recv(4096)
            if not b: break
            d.sendall(b)
    except: pass
    finally:
        try: d.close()
        except: pass
        try: s.close()
        except: pass

def handle(c):
    t = socket.socket()
    t.settimeout(30)
    c.settimeout(30)
    t.connect((rhost, rport))
    threading.Thread(target=pipe, args=(c, t), daemon=True).start()
    threading.Thread(target=pipe, args=(t, c), daemon=True).start()

s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('127.0.0.1', lport))
s.listen(128)
print(f'forwarder ready: {lport} -> {rhost}:{rport}', flush=True)
while True:
    threading.Thread(target=handle, args=s.accept(), daemon=True).start()
