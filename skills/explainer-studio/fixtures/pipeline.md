# How a request travels through an API gateway

A client app sends a request to the API gateway. The gateway is the single front door for every service.

Step one is authentication. The gateway checks the token in the request, and rejects it if the token is missing or invalid.

Step two is rate limiting. The gateway counts requests per client, and returns an error when a client sends too many.

Step three is routing. The gateway matches the path to a backend service, such as orders or payments, and forwards the request.

The service then reads or writes its database and builds a response.

On the way back, the gateway logs the request and the response time, then returns the response to the client.

Because every request follows the same path, the team can add caching or new checks in one place.
