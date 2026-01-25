from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import get_db, engine, Base
from models import Prompt, Watchlist
import models
from seed_prompts import seed_if_empty

# Create tables
Base.metadata.create_all(bind=engine)
seed_if_empty()

app = FastAPI(title="Stock Analysis System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Stock Analysis API is running"}

@app.get("/api/prompts")
def get_prompts(db: Session = Depends(get_db)):
    return db.query(Prompt).all()

@app.get("/api/prompts/{prompt_id}")
def get_prompt(prompt_id: str, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt

@app.post("/api/watchlist/{ticker}")
def add_to_watchlist(ticker: str, db: Session = Depends(get_db)):
    # Simple add for now
    item = Watchlist(symbol=ticker.upper())
    db.add(item)
    db.commit()
    return {"status": "added", "ticker": ticker}

@app.get("/api/watchlist")
def get_watchlist(db: Session = Depends(get_db)):
    return db.query(Watchlist).all()

from pydantic import BaseModel
from tavily_service import TavilyClient
from llm_service import LLMService

class AnalyzeRequest(BaseModel):
    ticker: str
    prompt_id: str
    extra_context: str = ""

@app.post("/api/analyze")
async def analyze_stock(request: AnalyzeRequest, db: Session = Depends(get_db)):
    # 1. Get Prompt
    prompt_obj = db.query(Prompt).filter(Prompt.id == request.prompt_id).first()
    if not prompt_obj:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # 2. Get Data from Tavily
    tavily = TavilyClient()
    market_data = await tavily.get_stock_quote(request.ticker)
    
    # 3. Prepare Context
    context = {
        "summary": market_data.get("summary", ""),
        "raw_data": market_data.get("raw_data", []),
        "context": request.extra_context
    }
    
    # 4. Call LLM
    llm = LLMService()
    result = await llm.analyze_stock(request.ticker, prompt_obj.text, context)
    
    return {
        "ticker": request.ticker,
        "prompt_title": prompt_obj.title,
        "analysis": result,
        "market_data_summary": market_data.get("summary")
    }

# --- Unified Chat API ---
from typing import List, Dict
from fastapi.responses import StreamingResponse
from unified_llm_service import UnifiedLLMService
from models import APIKey, Conversation, Message
from crypto_service import CryptoService

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    provider: str = "deepseek"
    model: str = "deepseek-chat"
    conversation_id: str = None
    enable_web_search: bool = False

class KeyConfig(BaseModel):
    provider: str
    alias: str
    key: str

@app.post("/api/chat/completions")
async def chat_completions(request: ChatRequest, db: Session = Depends(get_db)):
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages is empty.")
    service = UnifiedLLMService(db)
    try:
        llm = service.get_provider(request.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return StreamingResponse(
        service.chat_stream(
            messages=request.messages,
            provider=request.provider,
            model=request.model,
            conversation_id=request.conversation_id,
            enable_web_search=request.enable_web_search,
            llm=llm
        ),
        media_type="text/event-stream"
    )

@app.post("/api/config/keys")
def add_api_key(config: KeyConfig, db: Session = Depends(get_db)):
    if not (config.key or "").strip():
        raise HTTPException(status_code=400, detail="API key is empty.")

    try:
        crypto = CryptoService()
        encrypted = crypto.encrypt(config.key)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Check if exists
    existing = db.query(APIKey).filter(APIKey.provider == config.provider, APIKey.alias == config.alias).first()
    if existing:
        existing.encrypted_key = encrypted
        existing.is_active = True
    else:
        new_key = APIKey(
            provider=config.provider,
            alias=config.alias,
            encrypted_key=encrypted
        )
        db.add(new_key)
    
    db.commit()
    return {"status": "success", "msg": f"Key for {config.provider} saved securely."}

@app.get("/api/conversations")
def get_conversations(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    total = db.query(Conversation).count()
    items = db.query(Conversation).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}

@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()

class UpdateConversationRequest(BaseModel):
    title: str

@app.patch("/api/conversations/{conversation_id}")
def update_conversation(conversation_id: str, request: UpdateConversationRequest, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = request.title
    db.commit()
    db.refresh(conversation)
    
    return conversation

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    # 1. Check if conversation exists
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # 2. Delete all associated messages
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    
    # 3. Delete the conversation
    db.delete(conversation)
    db.commit()
    
    return {"status": "success", "msg": "Conversation deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
