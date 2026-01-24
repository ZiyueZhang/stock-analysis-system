from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any

class BaseProvider(ABC):
    @abstractmethod
    async def stream_chat(self, messages: List[Dict[str, str]], model: str, tools: List[Dict] = None, **kwargs) -> AsyncGenerator[Any, None]:
        """
        Stream chat completion.
        Yields chunks of generated text or tool calls.
        """
        pass

    @abstractmethod
    async def check_health(self) -> bool:
        """
        Verify API key validity.
        """
        pass
