'use client';

import { useState, useEffect, useRef } from 'react';
import { useGroceryStore } from '../../store/groceryStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { 
  X, Sparkles, Send, Loader2, Bot, User, ArrowLeft, 
  Trash2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AssistantConfig {
  id: string;
  name: string;
  title: string;
  emoji: string;
  purpose: string[];
  examples: string[];
  welcome: string;
}

interface Message {
  _id?: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

const ASSISTANTS: AssistantConfig[] = [
  {
    id: 'ALEX',
    name: 'ALEX',
    title: 'AI Prediction Expert',
    emoji: '🧠',
    purpose: [
      'Predict expiry dates',
      'Suggest shelf life',
      'Recommend storage methods',
      'Analyze grocery freshness'
    ],
    examples: [
      'When will my milk expire?',
      'How long can bananas stay fresh?',
      'Is this product still safe to consume?'
    ],
    welcome: "Hi {userName} 👋 I'm Alex. I'll help you understand product freshness, shelf life, and expiry dates."
  },
  {
    id: 'MAYA',
    name: 'MAYA',
    title: 'Recipe Assistant',
    emoji: '🍽️',
    purpose: [
      'Generate recipes from groceries',
      'Suggest meals using expiring items',
      'Recommend healthy combinations'
    ],
    examples: [
      'What can I cook with eggs and tomatoes?',
      'Give me a breakfast recipe.',
      'Use items that expire tomorrow.'
    ],
    welcome: "Hello {userName} 🍽️ I'm Maya. Tell me what ingredients you have, and I'll help you cook something delicious."
  },
  {
    id: 'BUDDY',
    name: 'BUDDY',
    title: 'Food Waste Prevention AI',
    emoji: '♻️',
    purpose: [
      'Prevent food waste',
      'Suggest which items to consume first',
      'Create priority consumption plans'
    ],
    examples: [
      'Which items should I use today?',
      'How can I reduce food waste?',
      'What groceries are at risk?'
    ],
    welcome: "Hey {userName} ♻️ I'm Buddy. Let's save food and reduce waste together."
  },
  {
    id: 'SAM',
    name: 'SAM',
    title: 'Analytics Assistant',
    emoji: '📊',
    purpose: [
      'Analyze grocery usage',
      'Generate insights',
      'Show trends and recommendations'
    ],
    examples: [
      'Which items do I waste most?',
      'Monthly waste analysis.',
      'Grocery spending trends.'
    ],
    welcome: "Hi {userName} 📊 I'm Sam. I can help you understand your grocery trends and shopping habits."
  }
];

export default function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const { user } = useAuthStore();
  const userName = user?.name || 'Narasimha';

  const [activeAssistant, setActiveAssistant] = useState<AssistantConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const activeAssistantRef = useRef<AssistantConfig | null>(null);

  // Sync ref with activeAssistant state
  useEffect(() => {
    activeAssistantRef.current = activeAssistant;
  }, [activeAssistant]);

  // Handle browser back button gesture for steps back
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ smartAIModal: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (activeAssistantRef.current) {
        setActiveAssistant(null);
        window.history.pushState({ smartAIModal: true }, '');
      } else {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (typeof window !== 'undefined' && window.history.state?.smartAIModal) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  // Load chat history from backend database when assistant is selected
  useEffect(() => {
    if (!activeAssistant) {
      setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await api.get('/ai/history', {
          params: { assistant: activeAssistant.name.toLowerCase() }
        });
        
        const historyData = response.data.data;
        if (historyData && historyData.length > 0) {
          // Format DB logs
          const formatted: Message[] = historyData.map((chat: any) => ({
            sender: chat.role === 'user' ? 'user' : 'ai',
            text: chat.content,
            timestamp: new Date(chat.timestamp)
          }));
          setMessages(formatted);
        } else {
          // Initial greeting fallback
          const welcomeText = activeAssistant.welcome.replace('{userName}', userName);
          setMessages([
            {
              sender: 'ai',
              text: welcomeText,
              timestamp: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching AI history:', err);
        // Fallback welcome message
        const welcomeText = activeAssistant.welcome.replace('{userName}', userName);
        setMessages([
          {
            sender: 'ai',
            text: welcomeText,
            timestamp: new Date()
          }
        ]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [activeAssistant, userName]);

  if (!isOpen) return null;

  // Send message to assistant
  const handleSendMessage = async (textToSend?: string) => {
    const msgText = textToSend || inputMessage;
    if (!msgText.trim() || !activeAssistant || isGenerating) return;

    // Add user message locally
    const userMsg: Message = {
      sender: 'user',
      text: msgText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      const response = await api.post('/ai/chat', {
        assistant: activeAssistant.name.toLowerCase(),
        message: msgText
      });

      const aiResponse = response.data.response;
      
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponse || "Unable to reach AI service. Please try again.",
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('Error contacting AI engine:', err);
      // Fulfill precise requirements: Show "Unable to reach AI service. Please try again."
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "Unable to reach AI service. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    if (!activeAssistant) return;
    
    const confirmClear = window.confirm(`Are you sure you want to clear your chat history with ${activeAssistant.name}?`);
    if (!confirmClear) return;

    try {
      await api.delete('/ai/history', {
        params: { assistant: activeAssistant.name.toLowerCase() }
      });
      // Reset locally with welcome message
      const welcomeText = activeAssistant.welcome.replace('{userName}', userName);
      setMessages([
        {
          sender: 'ai',
          text: welcomeText,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error('Error clearing chat history:', err);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  // Quick select example question
  const handleQuickQuestion = (question: string, assistant: AssistantConfig) => {
    setActiveAssistant(assistant);
    setTimeout(() => {
      handleSendMessage(question);
    }, 300);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
        
        {/* Backdrop overlay */}
        <motion.div 
          className="absolute inset-0 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isGenerating) onClose();
          }}
        />

        {/* Modal Main Sheet */}
        <motion.div
          className="relative bg-zinc-950 w-full md:max-w-lg h-[92vh] md:h-[80vh] rounded-t-custom md:rounded-custom shadow-2xl flex flex-col overflow-hidden z-10 border border-zinc-800"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        >
          {/* Header Panel */}
          <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40 shrink-0">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-[13px] font-black text-purple-400 uppercase tracking-wider leading-none">
                  SMART AI
                </h3>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mt-1">
                  Professional Food Advisor
                </span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 cursor-pointer border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Content Panel */}
          <div className="flex-1 min-h-0 flex flex-col bg-zinc-950/20">
            <AnimatePresence mode="wait">
              
              {/* Category/Assistant Selection List View */}
              {!activeAssistant ? (
                <motion.div
                  key="selector-grid"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-5 flex-1 overflow-y-auto no-scrollbar flex flex-col justify-center gap-6"
                >
                  <div className="text-center py-1 shrink-0">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      CHOOSE YOUR SMART AI AGENT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
                    {ASSISTANTS.map((assistant) => (
                      <button 
                        key={assistant.id}
                        onClick={() => setActiveAssistant(assistant)}
                        className="bg-zinc-900/35 hover:bg-zinc-900/60 border border-zinc-900/70 hover:border-purple-500/20 rounded-[20px] py-8 px-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.97] hover:shadow-lg hover:shadow-purple-500/5 group relative overflow-hidden aspect-[4/3] md:aspect-square"
                      >
                        {/* Centered Large Emoji */}
                        <div className="text-3xl md:text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                          {assistant.emoji}
                        </div>
                        
                        {/* Centered Large Name */}
                        <h4 className="text-xs md:text-[13px] font-black text-zinc-100 group-hover:text-purple-400 uppercase tracking-widest transition-colors duration-300">
                          {assistant.name}
                        </h4>
                        
                        {/* Centered Subtitle */}
                        <span className="text-[7.5px] md:text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mt-1.5 leading-normal max-w-[90%]">
                          {assistant.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="chat-feed"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Navigation bar to return to menu */}
                  <div className="px-5 py-2.5 bg-zinc-900/20 border-b border-zinc-900 flex items-center justify-between shrink-0">
                    <button
                      onClick={() => setActiveAssistant(null)}
                      className="text-[9px] font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>MENU</span>
                    </button>

                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span>{activeAssistant.emoji}</span>
                      <span>{activeAssistant.name}</span>
                    </span>

                    <button
                      onClick={handleClearHistory}
                      className="p-1 rounded bg-zinc-900 hover:bg-red-950/10 border border-zinc-850 hover:border-red-950/30 text-zinc-550 hover:text-red-400 cursor-pointer transition-all active:scale-95"
                      title="Clear History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Chat bubbles list area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar min-h-0">
                    {loadingHistory ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        <span className="text-[9px] font-black text-zinc-550 uppercase tracking-wider animate-pulse">
                          Syncing Secure Chat Logs...
                        </span>
                      </div>
                    ) : (
                      messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 max-w-[85%] ${
                            m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          {/* Sender Icon */}
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                            m.sender === 'ai' 
                              ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' 
                              : 'bg-zinc-800 text-zinc-355 border border-zinc-700'
                          }`}>
                            {m.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>

                          {/* Speech Bubble */}
                          <div className="flex flex-col">
                            <div className={`p-3.5 rounded-2xl text-[10.5px] leading-relaxed whitespace-pre-line border text-left ${
                              m.sender === 'user'
                                ? 'bg-purple-650/10 border-purple-500/25 text-purple-200 rounded-tr-none shadow-md shadow-purple-500/5'
                                : 'bg-zinc-900/60 border-zinc-900 text-zinc-300 rounded-tl-none shadow-inner'
                            }`}>
                              {m.text}
                            </div>
                            
                            {/* Timestamp */}
                            <span className={`text-[7.5px] font-bold text-zinc-655 mt-1 block uppercase tracking-wider ${
                              m.sender === 'user' ? 'text-right' : 'text-left'
                            }`}>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    {/* AI Loading/Generating indicator */}
                    {isGenerating && (
                      <div className="flex gap-3 max-w-[85%]">
                        <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0 animate-pulse">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-zinc-900/60 border-zinc-900 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-inner">
                          <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                          <span className="text-[8.5px] font-bold text-zinc-550 uppercase tracking-widest animate-pulse">
                            {activeAssistant.name} is typing...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Dynamic context-aware suggestions helper area */}
                  {messages.length <= 1 && !isGenerating && (
                    <div className="px-4 pb-2.5 shrink-0 select-none">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1.5">
                        Suggested questions:
                      </span>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {activeAssistant.examples.map((example, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(example)}
                            className="px-3 py-1.5 rounded-xl border border-zinc-900 bg-zinc-900/40 hover:bg-purple-950/10 hover:border-purple-500/20 text-zinc-400 hover:text-purple-300 text-[8.5px] font-bold uppercase tracking-wider flex-shrink-0 cursor-pointer transition-all"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input form area */}
                  <div className="px-4 py-3 border-t border-zinc-900 bg-zinc-900/10 flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder={`Message ${activeAssistant.name}...`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      disabled={isGenerating || loadingHistory}
                      className="flex-1 bg-zinc-900/90 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                    />

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isGenerating || loadingHistory || !inputMessage.trim()}
                      className={`p-2.5 rounded-xl cursor-pointer active:scale-95 transition-all shadow-md shrink-0 border ${
                        inputMessage.trim() 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 border-blue-500' 
                          : 'bg-zinc-900/60 disabled:bg-zinc-950/20 text-zinc-550 border-zinc-900/50 shadow-inner'
                      }`}
                    >
                      <Send className={`w-4 h-4 transition-colors ${
                        inputMessage.trim() ? 'text-white' : 'text-zinc-600'
                      }`} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
