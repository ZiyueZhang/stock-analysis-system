import os
from openai import AsyncOpenAI
import config

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("LLM_MODEL", "gpt-4-turbo-preview")
        
        if not self.api_key:
            print("Warning: LLM_API_KEY not found. Analysis features will fail.")
            
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    async def analyze_stock(self, ticker: str, prompt_template: str, context_data: dict) -> str:
        """
        Orchestrates the analysis by filling the prompt and calling the LLM.
        """
        # 1. Fill placeholders
        filled_prompt = self._fill_prompt(prompt_template, ticker, context_data)
        
        # 2. Call LLM
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional financial analyst."},
                    {"role": "user", "content": filled_prompt}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Error: {e}")
            return f"Error generating analysis: {str(e)}"

    def _fill_prompt(self, template: str, ticker: str, data: dict) -> str:
        """
        Replaces [[Placeholder]] with actual data.
        """
        content = template.replace("[[Ticker]]", ticker)
        content = content.replace("[Ticker]", ticker)
        
        # Handle Price Data
        price_info = "N/A"
        if "summary" in data:
             price_info = data["summary"]
        elif "raw_data" in data and isinstance(data["raw_data"], list):
             # Simple concatenation of search results if summary is missing
             price_info = "\n".join([r.get('content', '') for r in data["raw_data"][:3]])
             
        content = content.replace("[[Price]]", price_info)
        content = content.replace("[Price Data]", price_info)
        content = content.replace("[[Price Data]]", price_info)
        
        # Handle Context/Knowledge Base
        kb_info = data.get("context", "No specific context provided.")
        content = content.replace("[[Context]]", kb_info)
        content = content.replace("[Context]", kb_info)
        
        # Handle Event
        event_info = data.get("event", "No specific event.")
        content = content.replace("[[Event]]", event_info)
        content = content.replace("[Event]", event_info)
        
        return content
