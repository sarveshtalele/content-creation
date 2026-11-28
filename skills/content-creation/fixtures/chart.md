# Where 1,000 agent requests go

We traced 1,000 requests sent to a coding agent in one week. 400 were answered straight from the cache. The other 600 needed a model call.
Of those 600 model calls, 450 were answered directly and 150 needed a tool call first. Of the 150 tool calls, 120 succeeded on the first try and 30 needed a retry.
The cache is the cheapest path; tool calls are the slowest.
