# Anatomy of a web request

A web request is easier to understand when you pull it apart into layers.

The browser layer starts the request. It builds the address, sends headers, and waits for the answer.

The network layer carries the request. DNS finds the server, and TLS keeps the traffic private on the way.

The edge layer sits in front of the app. A CDN serves cached files, and a load balancer spreads traffic across servers.

The application layer does the work. Server code checks the user, applies business rules, and builds the response.

The data layer holds the truth. A database stores records, and a cache keeps hot answers close.
