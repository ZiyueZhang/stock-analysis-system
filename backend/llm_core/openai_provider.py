from typing import AsyncGenerator, List, Dict, Any
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from .base_provider import BaseProvider

class OpenAIProvider(BaseProvider):
    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1"):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def stream_chat(self, messages: List[Dict[str, str]], model: str, tools: List[Dict] = None, **kwargs) -> AsyncGenerator[str, None]:
        try:
            params = {
                "model": model,
                "messages": messages,
                "stream": True,
                **kwargs
            }
            if tools:
                params["tools"] = tools

            stream = await self.client.chat.completions.create(**params)
            
            async for chunk in stream:
                # 1. Handle Tool Calls (if any)
                # Note: Streaming tool calls comes in chunks. We need to yield special markers or handle it in the unified service.
                # However, for simplicity in this architecture, we yield raw chunks and let the UnifiedService reconstruct tool calls?
                # Actually, standard OpenAI streaming yields 'tool_calls' in delta.
                
                # To make this robust, we will yield a special object if it's a tool call chunk, 
                # OR we pass raw delta. UnifiedService needs to handle accumulation.
                # BUT, since we defined the interface as yielding 'str', we have a problem.
                # We need to yield objects or change interface. 
                # Let's change this to yield dicts or special strings.
                
                # For compatibility with existing frontend, we yield text.
                # If tool calls happen, we accumulate them internally? No, stream_chat is a generator.
                
                # REVISION: We will yield the RAW chunk object (or simplified dict) so UnifiedService can handle logic.
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    
                    # Case A: Content
                    if delta.content:
                        yield {"type": "content", "content": delta.content}
                    
                    # Case B: Tool Call
                    if delta.tool_calls:
                        yield {"type": "tool_call", "tool_calls": delta.tool_calls}
                        
                    # Case C: Finish Reason
                    if chunk.choices[0].finish_reason:
                        yield {"type": "finish", "finish_reason": chunk.choices[0].finish_reason}
                        
        except Exception as e:
            # Re-raise for tenacity to handle or caller to catch
            print(f"OpenAI Provider Error: {e}")
            raise e

    async def check_health(self) -> bool:
        try:
            # Simple list models call to verify key
            await self.client.models.list()
            return True
        except Exception:
            return False
