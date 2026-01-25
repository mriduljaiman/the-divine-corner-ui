import { useState, useEffect, useRef } from 'react';
import axios from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Get or create session ID
    let sid = localStorage.getItem('chatSessionId');
    if (!sid) {
      sid = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatSessionId', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!sessionId) return;

    try {
      const response = await axios.get(`/chat/session/${sessionId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!isAuthenticated()) {
      alert('Please login to use chat support');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/chat/send', {
        message: newMessage,
        sessionId
      });

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        title="Customer Support"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h4>Customer Support</h4>
            <button onClick={() => setIsOpen(false)} className="close-btn">×</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>👋 Welcome to The Divine Corner!</p>
                <p>How can we help you today?</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.messageType.toLowerCase()}`}
                >
                  <div className="message-content">
                    <p>{msg.message}</p>
                  </div>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chat-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !newMessage.trim()}>
              {loading ? '...' : '→'}
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .chat-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #6366f1;
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 999;
          transition: all 0.3s ease;
        }

        .chat-fab:hover {
          background: #4f46e5;
          transform: scale(1.05);
        }

        .chat-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          z-index: 999;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          background: #6366f1;
          color: white;
          padding: 1rem;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header h4 {
          margin: 0;
          font-size: 1rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          opacity: 0.8;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #f9fafb;
        }

        .welcome-message {
          text-align: center;
          padding: 2rem 1rem;
          color: #6b7280;
        }

        .welcome-message p {
          margin: 0.5rem 0;
        }

        .message {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
        }

        .message.user {
          align-items: flex-end;
        }

        .message.admin {
          align-items: flex-start;
        }

        .message-content {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          word-wrap: break-word;
        }

        .message.user .message-content {
          background: #6366f1;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.admin .message-content {
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
        }

        .message-content p {
          margin: 0;
          font-size: 0.875rem;
        }

        .message-time {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.25rem;
          padding: 0 0.5rem;
        }

        .chat-input {
          display: flex;
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          background: white;
          border-radius: 0 0 12px 12px;
        }

        .chat-input input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          margin-right: 0.5rem;
          font-size: 0.875rem;
        }

        .chat-input input:focus {
          outline: none;
          border-color: #6366f1;
        }

        .chat-input button {
          width: 40px;
          height: 40px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-input button:hover:not(:disabled) {
          background: #4f46e5;
        }

        .chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .chat-window {
            bottom: 80px;
            right: 10px;
            left: 10px;
            width: auto;
          }

          .chat-fab {
            right: 10px;
            bottom: 10px;
          }
        }
      `}</style>
    </>
  );
}
