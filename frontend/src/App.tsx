import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Key, MessageSquare, Menu, Loader2, Play } from 'lucide-react';
import { streamChat } from './api/stream';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { StrategyDetail } from './components/StrategyDetail';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Need to ensure prompt has 'text' field for display
  interface Prompt {
    id: string;
    title: string;
    desc: string;
    icon: string;
    text?: string;
    categories: string[];
  }

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface Message {
  role: string;
  content: string;
  created_at?: string;
}

function App() {
  // Global State
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Active Chat State
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Input State
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamBuffer, setStreamContent] = useState('');
  
  // Computed Properties for UI
  const currentMode: 'initial' | 'followup' = selectedPrompt ? 'initial' : 'followup';
  const currentStrategyName = selectedPrompt?.title;
  const currentPlaceholder = currentMode === 'initial' 
      ? "Enter ticker (e.g. NVDA) to start analysis..." 
      : "Ask a follow-up question...";

  // UI State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Default hidden on mobile, visible on desktop via CSS
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('deepseek');
  const [enableWebSearch, setEnableWebSearch] = useState(true);

  // 1. Initial Data Load
  useEffect(() => {
    fetchPrompts();
    fetchConversations();
  }, []);

  const fetchPrompts = () => {
    axios.get(`${API_BASE_URL}/prompts`)
      .then(res => setPrompts(res.data))
      .catch(err => console.error("Failed to fetch prompts", err));
  };

  const fetchConversations = () => {
    axios.get(`${API_BASE_URL}/conversations`)
      .then(res => setConversations(res.data.items || []))
      .catch(err => console.error("Failed to fetch history", err));
  };

  // 2. Load Messages when switching conversations
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    axios.get(`${API_BASE_URL}/conversations/${activeConversationId}/messages`)
      .then(res => {
        setMessages(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeConversationId]);

  // 3. New Chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setTicker('');
    setSelectedPrompt(null);
  };

  // 4. Analysis & Streaming
  const handleStreamAnalyze = async () => {
    if (!selectedPrompt || !ticker) return;
    setLoading(true);
    setStreamContent(''); // Clear buffer
    
    // Optimistic UI: Add user message immediately
    const userContent = `Analyze ${ticker} using strategy: ${selectedPrompt.title}.`;
    const tempUserMsg = { role: 'user', content: userContent };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
       const msgsToSend = [
         { role: 'system', content: getSystemPrompt() },
         { role: 'user', content: userContent }
       ];
       
       await streamChat(
         msgsToSend,
         (chunk, convId) => {
            // Update buffer
            setStreamContent(prev => prev + chunk);
            
            // If it's the first chunk and we got a conversation ID, set it
            if (convId && !activeConversationId) {
                // We won't set it immediately to avoid re-fetching messages mid-stream
                // Instead we just keep streaming to the buffer
            }
         },
         () => {
            setLoading(false);
            // After stream is done, refresh everything to sync with DB
            fetchConversations();
            // If this was a new chat, we need to find the new ID (tricky without return)
            // Ideally backend returns ID in first chunk. 
            // For now, let's just refresh the conversation list and reload the latest one if it was new
            if (!activeConversationId) {
                axios.get(`${API_BASE_URL}/conversations?limit=1`).then(res => {
                    if (res.data.items.length > 0) {
                        setActiveConversationId(res.data.items[0].id);
                    }
                });
            } else {
                // Reload messages to get the persisted assistant message
                axios.get(`${API_BASE_URL}/conversations/${activeConversationId}/messages`)
                    .then(res => setMessages(res.data));
            }
            setStreamContent('');
         },
         (err) => { 
             console.error(err); 
             setLoading(false); 
             setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.message}` }]);
         },
         provider,
         'deepseek-chat',
         activeConversationId || undefined,
         enableWebSearch
       );
       
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // 5. Handle Delete
  const handleDeleteConversation = async (id: string) => {
    try {
        await axios.delete(`${API_BASE_URL}/conversations/${id}`);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
            handleNewChat();
        }
    } catch (e) {
        console.error("Failed to delete", e);
        alert("Failed to delete conversation");
    }
  };

  // 6. Handle Manual Send / Auto-Analyze
  const handleSendMessage = async (text: string) => {
      if (!text.trim()) return;
      
      // Determine if this is a Ticker input (new chat & no ticker set)
      let inputTicker = ticker;
      let promptToUse = selectedPrompt;
      let messageContent = text;

      // If we don't have an active conversation, try to parse ticker from input
      if (!activeConversationId && !ticker) {
          // Relaxed heuristic: Any input for a new chat is considered a target
          inputTicker = text.trim();
          setTicker(inputTicker);
      }

      // Logic Decoupling: Message Construction Pipeline
      // Always wrap the message if a strategy is selected, regardless of session state
      if (promptToUse) {
          // Check if it's the very first message (Analysis Trigger) or a follow-up with strategy context
          if (!activeConversationId && inputTicker === text.trim()) {
               // Initial Analysis
               messageContent = `Analyze ${inputTicker} using strategy: ${promptToUse.title}.`;
          } else {
               // Follow-up with Strategy Context
               // We explicitly instruct the LLM to use the strategy framework for this specific request
               messageContent = `Please answer the following request using the '${promptToUse.title}' strategy framework: ${text}`;
          }
      } else if (!activeConversationId && inputTicker) {
          // No strategy selected, but it's a new ticker analysis (Free Chat start)
          messageContent = `Analyze ${inputTicker}`;
      }

      const newMsg = { role: 'user', content: messageContent };
      setMessages(prev => [...prev, newMsg]);
      setLoading(true);
      setStreamContent('');

      try {
        // Construct history for context
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        history.push(newMsg);
        
        // If it's a new chat, we might want to add a system prompt first
        if (history.length === 1) {
            history.unshift({ role: 'system', content: getSystemPrompt() });
        }

        await streamChat(
            history,
            (chunk) => setStreamContent(prev => prev + chunk),
            () => {
                setLoading(false);
                setStreamContent('');
                // Reload to get persisted message and ensure ID is set
                if (activeConversationId) {
                    axios.get(`${API_BASE_URL}/conversations/${activeConversationId}/messages`)
                        .then(res => setMessages(res.data));
                } else {
                    fetchConversations();
                    // Try to find the new conversation ID
                     axios.get(`${API_BASE_URL}/conversations?limit=1`).then(res => {
                        if (res.data.items.length > 0) {
                            setActiveConversationId(res.data.items[0].id);
                        }
                    });
                }
            },
            (err) => {
                console.error(err);
                setLoading(false);
                setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.message}` }]);
            },
            provider,
            'deepseek-chat',
            activeConversationId || undefined,
            enableWebSearch
        );
      } catch (e) {
          console.error(e);
          setLoading(false);
      }
  };

  // 7. Handle Rename
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/conversations/${id}`, { title: newTitle });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    } catch (e) {
      console.error("Failed to rename", e);
      alert("Failed to rename conversation");
    }
  };

  const saveKey = async () => {
    try {
      await axios.post(`${API_BASE_URL}/config/keys`, {
        provider,
        alias: 'default',
        key: apiKey
      });
      alert('Key saved!');
      setShowKeyModal(false);
    } catch (e) {
      alert('Failed to save key');
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    if (selectedPrompt?.id === prompt.id) {
        setSelectedPrompt(null);
    } else {
        setSelectedPrompt(prompt);
    }
  };

  const getSystemPrompt = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `You are a helpful financial assistant. Today is ${dateStr}. Current time: ${timeStr}.`;
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 h-full bg-white border-r-2 border-slate-200 transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <Sidebar 
            conversations={conversations} 
            activeId={activeConversationId} 
            onSelect={(id) => { setActiveConversationId(id); setShowSidebar(false); }} 
            onNewChat={() => { handleNewChat(); setShowSidebar(false); }}
            onDelete={handleDeleteConversation}
            onRename={handleRenameConversation}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-paper border-b-2 border-dashed border-ink flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden p-2 hover:bg-slate-100 rounded">
                <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span className="bg-brand text-white px-2 transform -rotate-2 text-sm">AI</span>
              Stock Analyst
            </h1>
          </div>
          <button 
            onClick={() => setShowKeyModal(true)}
            className="p-2 border-2 border-ink rounded hover:bg-slate-100 text-ink"
            title="API Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Workspace Grid */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Middle Column: Chat Window */}
            <ChatWindow 
                messages={messages} 
                loading={loading} 
                streamContent={streamBuffer}
                onSend={handleSendMessage}
                disabled={loading}
                placeholder={currentPlaceholder}
                strategyName={currentStrategyName}
                mode={currentMode}
            />

            {/* Right Column: Config & Details (Only visible on new chat or desktop) */}
            <div className={`${activeConversationId ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 bg-white border-l-2 border-slate-200 flex-col overflow-hidden flex-shrink-0`}>
                
                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    
                    {/* Section: Configuration */}
                    <div>
                        <h3 className="font-bold text-sm uppercase text-slate-500 mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Configuration
                        </h3>
                        
                        {/* Web Search Toggle */}
                        <div className="flex items-center justify-between mb-6 p-2 bg-slate-50 rounded border-2 border-slate-200">
                            <span className="text-xs font-bold text-ink flex items-center gap-2">
                                🌐 Enable Web Search
                            </span>
                            <button 
                                onClick={() => setEnableWebSearch(!enableWebSearch)}
                                className={`w-10 h-5 rounded-full p-1 transition-colors ${enableWebSearch ? 'bg-brand' : 'bg-slate-300'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${enableWebSearch ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        
                        {/* Prompt List */}
                        <div>
                            <label className="block text-xs font-bold text-ink mb-2">Select Strategy</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {prompts.map(p => (
                                    <div 
                                        key={p.id}
                                        onClick={() => handleSelectPrompt(p)}
                                        className={`group relative p-3 border-2 rounded cursor-pointer transition-all ${
                                            selectedPrompt?.id === p.id 
                                            ? 'border-brand bg-brand-50 shadow-[2px_2px_0px_#db7c00]' 
                                            : 'border-slate-200 hover:border-slate-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{p.icon}</span>
                                            <span className="text-xs font-bold truncate">{p.title}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section: Strategy Detail Preview */}
                    <StrategyDetail prompt={selectedPrompt} />
                </div>
            </div>
        </div>
      </div>

      {/* Key Config Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full border-4 border-ink shadow-[8px_8px_0px_black]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5"/> Configure API Keys</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Provider</label>
                <select 
                  value={provider} 
                  onChange={e => setProvider(e.target.value)}
                  className="w-full p-2 border-2 border-slate-300 rounded"
                >
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                  <option value="qwen">Qwen (Tongyi)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full p-2 border-2 border-slate-300 rounded" 
                  placeholder="sk-..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowKeyModal(false)} className="px-4 py-2 text-sm font-bold">Cancel</button>
                <button onClick={saveKey} className="px-4 py-2 bg-brand text-white font-bold rounded border-2 border-black shadow-[2px_2px_0px_black]">Save Key</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
