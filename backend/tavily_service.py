import os
import httpx
import json
import datetime
from dotenv import load_dotenv

load_dotenv()

class TavilyClient:
    BASE_URL = "https://api.tavily.com/search"

    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        # Simple in-memory cache: {query: {"data": ..., "timestamp": ...}}
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes
        if not self.api_key:
            print("Warning: TAVILY_API_KEY not found in environment variables.")

    async def search(self, query: str, search_depth: str = "basic", max_results: int = 5, include_domains: list = None):
        if not self.api_key:
            return {"error": "Tavily API Key is missing"}

        # Check Cache
        now = datetime.datetime.now().timestamp()
        if query in self._cache:
            entry = self._cache[query]
            if now - entry["timestamp"] < self._cache_ttl:
                print(f"[Tavily] Cache hit for: {query}")
                return entry["data"]
            
        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": search_depth,
            "include_answer": True,
            "max_results": max_results
        }
        
        if include_domains:
            payload["include_domains"] = include_domains
        
        async with httpx.AsyncClient() as client:
            try:
                print(f"[Tavily] Searching: {query}")
                response = await client.post(self.BASE_URL, json=payload, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                
                # Update Cache
                self._cache[query] = {"data": data, "timestamp": now}
                return data
            except httpx.HTTPStatusError as e:
                print(f"Error calling Tavily: {e}")
                return {"error": str(e)}
            except Exception as e:
                print(f"Unexpected error: {e}")
                return {"error": str(e)}

    async def get_stock_quote(self, ticker: str):
        """
        Uses Tavily search to find stock price.
        Query: "{ticker} stock price current"
        """
        query = f"{ticker} stock price current market cap"
        result = await self.search(query, search_depth="basic")
        
        if "answer" in result:
            return {
                "ticker": ticker,
                "summary": result["answer"],
                "raw_data": result.get("results", [])
            }
        return {"error": "No data found", "details": result}
