import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';

interface Prompt {
  title: string;
  text?: string;
}

interface StrategyDetailProps {
  prompt: Prompt | null;
}

export const StrategyDetail: React.FC<StrategyDetailProps> = ({ prompt }) => {
  if (!prompt) return null;

  // Safe parsing function
  const renderContent = () => {
    try {
      const text = prompt.text;
      
      if (typeof text !== 'string') {
        return <span className="text-slate-400 italic">No prompt content available.</span>;
      }

      // Robust splitting for variables like ${var} or [[var]]
      // Matches: ${...} OR [[...]]
      const parts = text.split(/(\$\{.*?\}|\[\[.*?\]\])/g);

      return (
        <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (part.match(/^(\$\{.*?\}|\[\[.*?\]\])$/)) {
              return (
                <span 
                  key={i} 
                  className="bg-yellow-300 text-black px-1 rounded font-bold mx-0.5 border border-yellow-400 shadow-sm"
                >
                  {part}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    } catch (e) {
      console.error("StrategyDetail Render Error:", e);
      return (
        <div className="p-3 bg-red-50 text-red-600 rounded border border-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Error rendering prompt preview.</span>
        </div>
      );
    }
  };

  return (
    <div className="border-t-4 border-ink pt-4 mt-6">
      <h3 className="font-bold text-sm uppercase text-slate-500 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Strategy Detail
      </h3>
      <div className="bg-slate-50 border-2 border-slate-200 rounded p-4 overflow-x-auto max-h-96 overflow-y-auto shadow-inner">
        <div className="font-bold text-brand mb-2 text-sm border-b border-slate-200 pb-2">
          {prompt.title}
        </div>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Internal Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <span className="text-red-500 text-xs">Something went wrong displaying this section.</span>;
    }
    return this.props.children;
  }
}
