import React, { useState } from 'react';
import { MessageSquare, Clock, Search, Trash2, Edit2, Check, X } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ conversations, activeId, onSelect, onNewChat, onDelete, onRename }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this analysis?')) {
          onDelete(id);
      }
  };

  const startRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || 'Untitled Analysis');
  };

  const saveRename = (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="w-full md:w-64 bg-white border-r-2 border-dashed border-ink flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b-2 border-dashed border-ink">
        <button 
          onClick={onNewChat}
          className="w-full py-2 bg-ink text-white font-bold rounded shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" /> New Analysis
        </button>
      </div>
      
      <div className="p-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search history..." 
            className="w-full pl-9 pr-3 py-2 text-sm border-2 border-slate-200 rounded focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {conversations.map(conv => (
          <div 
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group p-3 rounded cursor-pointer border-2 transition-all relative pr-16 ${
              activeId === conv.id 
                ? 'bg-brand-50 border-brand' 
                : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
            }`}
          >
            {editingId === conv.id ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full text-sm p-1 border border-brand rounded focus:outline-none"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveRename(e);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <button onClick={saveRename} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3 h-3" /></button>
                <button onClick={cancelRename} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <>
                <h4 className="font-bold text-sm truncate text-ink">{conv.title || 'Untitled Analysis'}</h4>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
                </div>
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white/80 backdrop-blur-sm rounded">
                  <button 
                      onClick={(e) => startRename(e, conv)}
                      className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand-50 rounded transition-all"
                      title="Rename"
                  >
                      <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Delete"
                  >
                      <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            No history found.
          </div>
        )}
      </div>
    </div>
  );
};
