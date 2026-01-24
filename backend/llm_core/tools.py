# Tool Definitions for Function Calling

WEB_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_web",
        "description": "Search the internet for real-time information, stock news, market data, or recent events. Use this whenever the user asks for current data that you don't know.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query, e.g. 'NVDA stock price', 'Tesla latest news', 'US interest rate decision'"
                }
            },
            "required": ["query"]
        }
    }
}
