#!/usr/bin/env python3
"""Testserver fuers Handy: liefert den Generator per HTTPS ins eigene WLAN.

    python3 dev/handy-test.py            # Projektordner, Port 8443
    python3 dev/handy-test.py --port 9000
    python3 dev/handy-test.py --ordner .  # anderen Ordner ausliefern

Warum HTTPS und nicht einfach `python3 -m http.server`?
WebCodecs (der Video-Encoder) und navigator.share laufen nur in einem
"secure context". Ueber http://192.168.x.x waere der Knopf "Video speichern"
am Handy tot — der PNG-Export funktioniert dort dagegen.

Das Zertifikat ist selbstsigniert, der Browser warnt also beim ersten Mal.
Es wird in dev/.zertifikat/ abgelegt und wiederverwendet, solange sich die
IP nicht aendert — so muss man die Warnung nicht bei jedem Start wegklicken.
"""
import argparse
import datetime
import http.server
import os
import socket
import ssl
import subprocess
import sys

STD_PORT = 8443
HIER = os.path.dirname(os.path.abspath(__file__))
CERT_ORDNER = os.path.join(HIER, '.zertifikat')


def lan_ip():
    """IP im lokalen Netz — die, unter der das Handy den Rechner erreicht."""
    for iface in ('en0', 'en1', 'en6'):
        try:
            ip = subprocess.run(['ipconfig', 'getifaddr', iface],
                                capture_output=True, text=True).stdout.strip()
            if ip:
                return ip
        except (OSError, subprocess.SubprocessError):
            pass
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        s.close()


def passt_noch(crt, ip):
    """Vorhandenes Zertifikat weiter benutzbar? (richtige IP, nicht abgelaufen)"""
    if not os.path.exists(crt):
        return False
    try:
        txt = subprocess.run(['openssl', 'x509', '-in', crt, '-noout', '-text'],
                             capture_output=True, text=True, check=True).stdout
        if ('IP Address:' + ip) not in txt:
            return False
        ende = subprocess.run(['openssl', 'x509', '-in', crt, '-noout', '-enddate'],
                              capture_output=True, text=True, check=True).stdout
        wann = datetime.datetime.strptime(ende.strip().split('=', 1)[1],
                                          '%b %d %H:%M:%S %Y %Z')
        return wann > datetime.datetime.utcnow() + datetime.timedelta(days=1)
    except (OSError, subprocess.SubprocessError, ValueError, IndexError):
        return False


def zertifikat(ip):
    """Selbstsigniertes Zertifikat auf diese IP, gecacht."""
    os.makedirs(CERT_ORDNER, exist_ok=True)
    key = os.path.join(CERT_ORDNER, 'key.pem')
    crt = os.path.join(CERT_ORDNER, 'cert.pem')
    if passt_noch(crt, ip) and os.path.exists(key):
        return crt, key, False

    conf = os.path.join(CERT_ORDNER, 'openssl.cnf')
    with open(conf, 'w') as f:
        f.write(
            '[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n'
            '[dn]\nCN=%s\n'
            '[ext]\nsubjectAltName=IP:%s,IP:127.0.0.1,DNS:localhost\n'
            'basicConstraints=CA:FALSE\n'
            'keyUsage=digitalSignature,keyEncipherment\n'
            'extendedKeyUsage=serverAuth\n' % (ip, ip))
    subprocess.run(
        ['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
         '-keyout', key, '-out', crt, '-days', '365', '-config', conf],
        check=True, capture_output=True)
    return crt, key, True


class Handler(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.1 haelt die Verbindung offen — ueber TLS laedt das Handy damit
    # die vielen kleinen Dateien (Designs, Schriften) deutlich schneller.
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        # Nichts zwischenspeichern, sonst testet man die alte Fassung.
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def log_message(self, fmt, *args):
        text = fmt % args
        if ' 404 ' in text or ' 500 ' in text:
            sys.stderr.write('  %s\n' % text)


def main():
    ap = argparse.ArgumentParser(description='Generator per HTTPS im WLAN ausliefern')
    ap.add_argument('--port', type=int, default=STD_PORT)
    ap.add_argument('--ordner', default=os.path.dirname(HIER))
    args = ap.parse_args()

    wurzel = os.path.abspath(args.ordner)
    if not os.path.exists(os.path.join(wurzel, 'index.html')):
        sys.exit('  Kein index.html in %s — falscher Ordner?' % wurzel)
    os.chdir(wurzel)

    ip = lan_ip()
    try:
        crt, key, neu = zertifikat(ip)
    except (OSError, subprocess.SubprocessError) as e:
        sys.exit('  Zertifikat fehlgeschlagen: %s' % e)

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(crt, key)

    try:
        httpd = http.server.ThreadingHTTPServer(('0.0.0.0', args.port), Handler)
    except OSError as e:
        sys.exit('  Port %d belegt (%s). Mit --port einen anderen waehlen.' % (args.port, e))
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

    print('')
    print('  Ordner: %s' % wurzel)
    print('')
    print('  Am Handy im selben WLAN oeffnen:')
    print('')
    print('      https://%s:%d/' % (ip, args.port))
    print('')
    if neu:
        print('  Neues Zertifikat erzeugt. Der Browser warnt beim ersten Aufruf:')
        print('  iOS "Details einblenden" -> "Diese Website besuchen",')
        print('  Android "Erweitert" -> "Weiter zu ... (unsicher)".')
        print('  Erst danach ist "Video speichern" aktiv.')
    else:
        print('  Zertifikat aus dev/.zertifikat/ wiederverwendet.')
    print('')
    print('  Beenden mit Strg-C')
    print('')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n  beendet')


if __name__ == '__main__':
    main()
