export const streamChat = async (
  messages: { role: string; content: string }[],
  onChunk: (chunk: string, conversationId?: string) => void,
  onDone: () => void,
  onError: (error: any) => void,
  provider = "deepseek",
  model = "deepseek-chat",
  conversationId?: string,
  enableWebSearch = false
) => {
  try {
    const response = await fetch('http://localhost:8000/api/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages, 
        provider, 
        model, 
        conversation_id: conversationId,
        enable_web_search: enableWebSearch
      })
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        throw new Error(data?.detail || data?.error || text || `Request failed (${response.status})`);
      } catch {
        throw new Error(text || `Request failed (${response.status})`);
      }
    }

    if (!response.body) throw new Error('ReadableStream not supported');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          if (jsonStr.trim() === '[DONE]') {
            onDone();
            return;
          }
          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              onError(new Error(data.error));
              return;
            }
            if (data.content) onChunk(data.content, data.conversation_id);
          } catch (e) {
          }
        }
      }
    }
  } catch (error) {
    onError(error);
  }
};
