import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const clamp = (value: number, min: number, max: number) => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

const initialPosition = () => {
  const iconSize = 64;
  return {
    x: window.innerWidth - iconSize - 24,
    y: window.innerHeight - iconSize - 24,
  };
};

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好，我是 AI 助手，很高兴为你演示低代码场景。',
    },
  ]);
  const [position, setPosition] = useState(initialPosition);

  const dragStateRef = useRef({
    dragging: false,
    moved: false,
    offsetX: 0,
    offsetY: 0,
  });
  const positionRef = useRef(position);
  const replyTimeoutRef = useRef<number>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current.dragging) {
        return;
      }

      dragStateRef.current.moved = true;

      const nextX = event.clientX - dragStateRef.current.offsetX;
      const nextY = event.clientY - dragStateRef.current.offsetY;

      const iconSize = 64;
      const safeX = clamp(nextX, 16, window.innerWidth - iconSize - 16);
      const safeY = clamp(nextY, 16, window.innerHeight - iconSize - 16);

      setPosition({ x: safeX, y: safeY });
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current.dragging) {
        return;
      }

      dragStateRef.current.dragging = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const iconSize = 64;
      setPosition((current) => ({
        x: clamp(current.x, 16, window.innerWidth - iconSize - 16),
        y: clamp(current.y, 16, window.innerHeight - iconSize - 16),
      }));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        window.clearTimeout(replyTimeoutRef.current);
      }
    };
  }, []);

  const startDrag = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { x, y } = positionRef.current;
    dragStateRef.current = {
      dragging: true,
      moved: false,
      offsetX: event.clientX - x,
      offsetY: event.clientY - y,
    };
  };

  const toggleOpen = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }

    setIsOpen((prev) => !prev);
  };

  const sendMessage = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    replyTimeoutRef.current = window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `这是来自 AI 的示例回复：“${trimmed}”。欢迎将这个示例扩展成真正的原生 AI 能力。`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 600);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const widgetStyle = useMemo<React.CSSProperties>(() => ({
    left: `${position.x}px`,
    top: `${position.y}px`,
  }), [position]);

  return (
    <div className="chatbot-widget" style={widgetStyle}>
      {isOpen ? (
        <div className="chatbot-panel">
          <div className="chatbot-panel__header">
            <div className="chatbot-panel__title">AI 原生低代码助手</div>
            <button className="chatbot-panel__close" onClick={() => setIsOpen(false)} aria-label="关闭聊天窗口">
              ×
            </button>
          </div>
          <div className="chatbot-panel__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message chatbot-message--${message.role}`}
                role="text"
              >
                <div className="chatbot-message__bubble">{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-panel__input">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="输入你的问题，按 Enter 发送"
              rows={2}
            />
            <button onClick={sendMessage}>发送</button>
          </div>
        </div>
      ) : null}
      <button
        className={`chatbot-toggle${isOpen ? ' chatbot-toggle--active' : ''}`}
        onMouseDown={startDrag}
        onClick={toggleOpen}
        aria-label="打开聊天机器人"
      >
        <span className="chatbot-toggle__label">AI</span>
      </button>
    </div>
  );
};

export const mountChatbotWidget = () => {
  const containerId = 'chatbot-widget-root';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  ReactDOM.render(<ChatbotWidget />, container);
};

export default ChatbotWidget;
