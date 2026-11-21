# How HTTPS keeps your connection private

When you open a website, your browser and the server talk across networks you do not control. Anyone on the path, such as a public Wi-Fi operator, could read or change plain HTTP traffic.

HTTPS fixes this by wrapping HTTP inside TLS. TLS gives the connection three properties: encryption, so eavesdroppers see only scrambled bytes; integrity, so tampering is detected; and authentication, so you know which server you reached.

Every connection starts with a handshake. The browser sends a hello message listing the TLS versions and cipher suites it supports. The server replies with its choice and its certificate.

The certificate is a signed statement that a public key belongs to a domain. A certificate authority signs it, and browsers ship with a list of authorities they trust. If the signature does not verify, or the name does not match the site, the browser shows a warning.

Next the two sides agree on a shared secret using a key exchange. TLS 1.3 uses ephemeral Diffie-Hellman, so each session gets fresh keys. Even if a server key leaks later, past sessions stay protected. This property is called forward secrecy.

After the handshake, both sides use the shared secret to encrypt every request and response with a fast symmetric cipher. TLS 1.3 completes the handshake in one round trip, which makes secure connections feel nearly as fast as plain ones.

Certificates expire, usually after 90 days for free authorities such as Let's Encrypt. Automation tools renew them without human effort. An expired certificate causes browsers to block the page.

HTTPS does not hide which domain you visit from the network, and it cannot protect you if the site itself is malicious. It protects the path between you and the server, nothing more.
