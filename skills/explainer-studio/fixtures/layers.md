# The layers of a web application

A web application is built in layers, and each layer has one job.

The presentation layer is what users see. It includes the browser, HTML and CSS for structure and style, and JavaScript for interaction.

The application layer holds the logic. It includes the API, business rules, and authentication.

The data layer stores information. It includes the database, a cache for fast reads, and a queue for background work.

The infrastructure layer runs everything. It includes servers, containers, and the network.

Each layer talks only to the layer next to it, which keeps changes small and failures contained.
