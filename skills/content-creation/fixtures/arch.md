# How a RAG app answers a question

A RAG app (retrieval-augmented generation) answers from your own documents. A user types a question into the web app. The request goes through the API gateway, which handles auth and rate limits.
The retriever embeds the question and searches the vector index to find passages. The vector index points back to the document store that holds the original files.
The retriever sends the top passages to the language model, which writes the answer and cites the passages. The answer streams back to the web app.
