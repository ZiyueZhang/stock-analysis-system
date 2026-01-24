import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { User, Bot, Loader2, Send, Paperclip } from 'lucide-react';

interface Message {
  role: string;
  content: string;
  created_at?: string;
}

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  streamContent?: string;
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  strategyName?: string;
  mode?: 'initial' | 'followup';
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, streamContent, onSend, disabled, placeholder, strategyName, mode }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || disabled || loading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-24">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-ink ${
              msg.role === 'user' ? 'bg-white' : 'bg-brand text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`max-w-[85%] rounded-lg p-4 border-2 border-ink shadow-[4px_4px_0px_rgba(0,0,0,0.1)] ${
              msg.role === 'user' ? 'bg-white' : 'bg-paper'
            }`}>
               {msg.role === 'user' ? (
                 <p className="whitespace-pre-wrap">{msg.content}</p>
               ) : (
                 <article className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-a:text-brand">
                   <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
                 </article>
               )}
            </div>
          </div>
        ))}

        {/* Streaming Content Bubble */}
        {(loading || streamContent) && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 border-2 border-ink animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="max-w-[85%] rounded-lg p-4 border-2 border-ink bg-paper shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
               <article className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-a:text-brand">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{streamContent || ''}</ReactMarkdown>
                 {loading && !streamContent && <span className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin"/> Thinking...</span>}
               </article>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t-2 border-dashed border-ink">
        <div className="max-w-4xl mx-auto">
            {/* Status Badge */}
            <div className="mb-2 flex items-center gap-2">
                {mode === 'initial' ? (
                    <span className="bg-brand text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        🚀 Starting Analysis {strategyName ? `with ${strategyName}` : '(Default Strategy)'}
                    </span>
                ) : (
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        💬 Free Chat {strategyName ? `(Context: ${strategyName})` : ''}
                    </span>
                )}
            </div>

            <div className="relative flex gap-2 items-end">
                <button className="p-3 text-slate-400 hover:text-ink hover:bg-slate-100 rounded-lg transition-colors" title="Attach file">
                    <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-lg focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Type a message... (Enter to send, Shift+Enter for new line)"}
                        className="w-full bg-transparent p-3 max-h-40 resize-none focus:outline-none text-sm"
                        rows={1}
                        disabled={disabled || loading}
                    />
                </div>

                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || disabled || loading}
                    className={`p-3 rounded-lg border-2 border-ink shadow-[2px_2px_0px_black] transition-all flex-shrink-0 ${
                        !input.trim() || disabled || loading
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-slate-300' 
                        : 'bg-brand text-white hover:translate-y-[1px] hover:shadow-[1px_1px_0px_black]'
                    }`}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
