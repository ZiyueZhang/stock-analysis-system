import json
from sqlalchemy.orm import Session
from models import APIKey, Conversation, Message
from crypto_service import CryptoService
from llm_core.openai_provider import OpenAIProvider
from typing import AsyncGenerator, List, Dict
import datetime
import uuid
import json
from llm_core.tools import WEB_SEARCH_TOOL
from tavily_service import TavilyClient

class UnifiedLLMService:
    def __init__(self, db: Session):
        self.db = db
        self.crypto = CryptoService()
        self.tavily = TavilyClient()

    def get_provider(self, provider_name: str):
        # 1. Fetch active key from DB
        key_record = self.db.query(APIKey).filter(
            APIKey.provider == provider_name,
            APIKey.is_active == True
        ).first()

        if not key_record:
            raise ValueError(f"No active API key found for provider: {provider_name}")

        # 2. Decrypt key
        raw_key = self.crypto.decrypt(key_record.encrypted_key)
        
        # 3. Instantiate provider (Factory logic)
        # Note: We can store base_url in APIKey table or env. 
        # For now, we assume standard URLs or env overrides.
        if provider_name in ["openai", "deepseek", "qwen"]:
             # DeepSeek/Qwen are OpenAI compatible
             import os
             base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
             if provider_name == "deepseek":
                 base_url = "https://api.deepseek.com/v1"
             elif provider_name == "qwen":
                 base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
                 
             return OpenAIProvider(api_key=raw_key, base_url=base_url)
        
        raise ValueError(f"Unsupported provider: {provider_name}")

    async def chat_stream(self, 
                          messages: List[Dict[str, str]], 
                          provider: str = "deepseek", 
                          model: str = "deepseek-chat",
                          conversation_id: str = None,
                          enable_web_search: bool = False) -> AsyncGenerator[str, None]:
        
        llm = self.get_provider(provider)
        tools = [WEB_SEARCH_TOOL] if enable_web_search else None
        
        # Create conversation if new
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            new_conv = Conversation(id=conversation_id, title=messages[0]['content'][:20])
            self.db.add(new_conv)
            self.db.commit()

        # Save User Message
        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=messages[-1]['content']
        )
        self.db.add(user_msg)
        self.db.commit()

        # --- Tool Call Execution Loop ---
        while True:
            # Stream Response
            full_response = ""
            tool_calls = {}  # index -> tool_call
            
            try:
                # We need to handle the complex yielding from OpenAIProvider
                async for chunk in llm.stream_chat(messages, model, tools=tools):
                    
                    # Type A: Content
                    if chunk["type"] == "content":
                        content_piece = chunk["content"]
                        full_response += content_piece
                        yield f"data: {json.dumps({'content': content_piece, 'conversation_id': conversation_id})}\n\n"
                    
                    # Type B: Tool Call Accumulation
                    elif chunk["type"] == "tool_call":
                        for tc in chunk["tool_calls"]:
                            idx = tc.index
                            if idx not in tool_calls:
                                tool_calls[idx] = {"id": tc.id, "function": {"name": "", "arguments": ""}, "type": "function"}
                            
                            if tc.id:
                                tool_calls[idx]["id"] = tc.id
                            
                            if tc.function:
                                if tc.function.name:
                                    tool_calls[idx]["function"]["name"] += tc.function.name
                                if tc.function.arguments:
                                    tool_calls[idx]["function"]["arguments"] += tc.function.arguments

                # Check if we have tool calls to execute
                if tool_calls:
                    # Append Assistant Message (with tool calls) to history
                    # Note: We don't save this intermediate message to DB to keep it clean for now, 
                    # OR we save it? Usually, we need to save it for context consistency.
                    # For simplicity, we keep it in memory 'messages' list for the next loop.
                    
                    # Convert tool_calls dict to list
                    tool_calls_list = [v for k, v in sorted(tool_calls.items())]
                    messages.append({
                        "role": "assistant",
                        "content": None,
                        "tool_calls": tool_calls_list
                    })
                    
                    # Execute Tools
                    for tc in tool_calls_list:
                        if tc["function"]["name"] == "search_web":
                            try:
                                args = json.loads(tc["function"]["arguments"])
                                query = args.get("query")
                                yield f"data: {json.dumps({'content': f'\n\n*Searching: {query}*...\n\n', 'conversation_id': conversation_id})}\n\n"
                                
                                # Execute Search
                                search_result = await self.tavily.search(query)
                                result_str = json.dumps(search_result)
                                
                                # Append Tool Output to history
                                messages.append({
                                    "tool_call_id": tc["id"],
                                    "role": "tool",
                                    "name": "search_web",
                                    "content": result_str
                                })
                            except Exception as e:
                                messages.append({
                                    "tool_call_id": tc["id"],
                                    "role": "tool",
                                    "name": "search_web",
                                    "content": f"Error executing search: {str(e)}"
                                })
                    
                    # Loop continues to send tool outputs back to LLM
                    continue
                
                # If no tool calls, we are done
                else:
                    # Save Assistant Message
                    asst_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=full_response
                    )
                    self.db.add(asst_msg)
                    self.db.commit()
                    
                    yield "data: [DONE]\n\n"
                    break

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
