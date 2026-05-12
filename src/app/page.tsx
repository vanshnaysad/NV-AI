'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ChevronDown, Zap, Settings, Atom, Globe, Moon, Sun, SplitSquareHorizontal, Trash2, Plus, MessageSquare, Menu, X } from 'lucide-react';

type Message = { role: string; content: string; content2?: string };
type ChatSession = { id: string; title: string; messages: Message[]; date: number };

export default function Chat() {
  const [model1, setModel1] = useState('llama-3-3-70b');
  const [model2, setModel2] = useState('llama-3-1-8b');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [input, setInput] = useState('');
  
  // Multi-chat states
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0); // 0: Logo burst, 1: Text type, 2: Flash out, 3: Done
  
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cinematic App Load Sequence
  useEffect(() => {
    const phase1 = setTimeout(() => setLoadingPhase(1), 1000);
    const phase2 = setTimeout(() => setLoadingPhase(2), 2500);
    const phase3 = setTimeout(() => setLoadingPhase(3), 3200);
    return () => { clearTimeout(phase1); clearTimeout(phase2); clearTimeout(phase3); };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') document.body.classList.add('light-mode');
    
    const savedChats = localStorage.getItem('nv_ai_chats');
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save History
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('nv_ai_chats', JSON.stringify(chats));
    }
  }, [chats]);

  const currentMessages = chats.find(c => c.id === currentChatId)?.messages || [];

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.classList.toggle('light-mode');
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setIsComparisonMode(false);
    if (isMobile) setIsSidebarOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c.id !== id);
    setChats(updatedChats);
    if (currentChatId === id) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
    if (updatedChats.length === 0) localStorage.removeItem('nv_ai_chats');
  };

  const models = [
    { id: 'llama-3-3-70b', name: 'Llama 3.3 70B', provider: 'Groq', icon: <Zap size={16} style={{ color: '#ef4444' }} /> },
    { id: 'llama-3-1-8b', name: 'Llama 3.1 8B', provider: 'Groq', icon: <Zap size={16} style={{ color: '#ef4444' }} /> },
    { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', icon: <Globe size={16} style={{ color: '#10b981' }} /> },
    { id: 'gemini-1.5-flash', name: 'Gemini Flash', provider: 'Google', icon: <Atom size={16} style={{ color: '#60a5fa' }} /> },
    { id: 'gemini-1.5-pro', name: 'Gemini Pro', provider: 'Google', icon: <Atom size={16} style={{ color: '#60a5fa' }} /> },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: <Sparkles size={16} style={{ color: '#c084fc' }} /> },
    { id: 'grok-beta', name: 'Grok', provider: 'xAI', icon: <Globe size={16} style={{ color: '#9ca3af' }} /> }
  ];

  const fetchStream = async (chatId: string, text: string, targetModel: string, isModel2: boolean, messageIndex: number) => {
    const chat = chats.find(c => c.id === chatId);
    const prevMsgs = chat ? chat.messages.slice(0, messageIndex - 1) : [];
    const newMessagesForAPI = [...prevMsgs, { role: 'user', content: text }];
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessagesForAPI, model: targetModel })
      });
      if (!res.ok) throw new Error(await res.text() || "API Error");
      if (!res.body) throw new Error("No response body");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            const updatedMsgs = [...c.messages];
            if (isModel2) updatedMsgs[messageIndex].content2 = aiText;
            else updatedMsgs[messageIndex].content = aiText;
            return { ...c, messages: updatedMsgs };
          }
          return c;
        }));
      }
    } catch (err: any) {
      const errorMsg = "Error: " + err.message;
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          const updatedMsgs = [...c.messages];
          if (isModel2) updatedMsgs[messageIndex].content2 = errorMsg;
          else updatedMsgs[messageIndex].content = errorMsg;
          return { ...c, messages: updatedMsgs };
        }
        return c;
      }));
    }
  };

  const sendMessage = async (text: string) => {
    let activeChatId = currentChatId;
    let newChats = [...chats];
    
    if (!activeChatId) {
      activeChatId = Date.now().toString();
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
      const newChat: ChatSession = { id: activeChatId, title, messages: [], date: Date.now() };
      newChats = [newChat, ...newChats];
      setChats(newChats);
      setCurrentChatId(activeChatId);
    }

    const userMessage: Message = { role: 'user', content: text };
    const aiMessage: Message = { role: 'assistant', content: '', content2: isComparisonMode ? '' : undefined };
    
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) return { ...c, messages: [...c.messages, userMessage, aiMessage] };
      return c;
    }));
    
    setIsLoading(true);
    setInput('');
    
    const activeChat = newChats.find(c => c.id === activeChatId)!;
    const aiIndex = activeChat.messages.length + 1; // +1 because we add user & ai
    
    if (isComparisonMode) {
      await Promise.all([
        fetchStream(activeChatId, text, model1, false, aiIndex),
        fetchStream(activeChatId, text, model2, true, aiIndex)
      ]);
    } else {
      await fetchStream(activeChatId, text, model1, false, aiIndex);
    }
    
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const selectedModel1Data = models.find(m => m.id === model1) || models[0];
  const selectedModel2Data = models.find(m => m.id === model2) || models[1];

  if (loadingPhase < 3) {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', perspective: '1200px'
      }}>
        <div style={{
          position: 'absolute', inset: 0, backgroundColor: 'white', zIndex: 100, pointerEvents: 'none',
          opacity: loadingPhase === 2 ? 0.8 : 0, transition: 'opacity 0.4s ease-out'
        }} />
        
        {/* Simple 3D Glass Sphere Logo with 3D Spin */}
        <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin3D 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', transformStyle: 'preserve-3d' }}>
          <img src="/logo.png" alt="NV AI Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 10px 30px rgba(99,102,241,0.4)', zIndex: 10 }} />
        </div>
        
        {/* Simple Loading Text */}
        <div style={{ marginTop: '30px', fontFamily: 'inherit', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '500', opacity: loadingPhase >= 1 ? 1 : 0, transition: 'opacity 0.5s', animation: 'float 2s ease-in-out infinite' }}>
          Welcome to NV AI
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin3D { 0% { transform: scale(0) rotateY(180deg) rotateX(45deg); opacity: 0; } 100% { transform: scale(1) rotateY(0deg) rotateX(0deg); opacity: 1; } }
          @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
          @keyframes flipIn3D { 0% { transform: rotateX(80deg) translateY(200px) scale(0.8); opacity: 0; } 100% { transform: rotateX(0deg) translateY(0) scale(1); opacity: 1; } }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', perspective: '1200px' }}>
      <div style={{ display: 'flex', width: '100%', height: '100%', animation: 'flipIn3D 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', transformOrigin: 'bottom center' }}>
      
      {/* Sidebar */}
      <div className={`glass-panel sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ 
        width: '300px', margin: '16px 0 16px 16px', display: 'flex', flexDirection: 'column', 
        transform: isSidebarOpen || !isMobile ? 'translateX(0)' : 'translateX(-120%)',
        position: !isMobile ? 'relative' : 'absolute', zIndex: 50, height: 'calc(100vh - 32px)',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-primary-3d" onClick={startNewChat} style={{ flex: 1, padding: '10px' }}>
            <Plus size={18} style={{ marginRight: '8px' }} /> New Chat
          </button>
          {isMobile && (
            <button className="btn-3d" onClick={() => setIsSidebarOpen(false)} style={{ padding: '8px', marginLeft: '8px' }}><X size={18} /></button>
          )}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>HISTORY</div>
          {chats.map(chat => (
            <div key={chat.id} className={`btn-3d chat-item ${currentChatId === chat.id ? 'active' : ''}`} 
                 onClick={() => { setCurrentChatId(chat.id); if (isMobile) setIsSidebarOpen(false); }}
                 style={{ 
                   justifyContent: 'space-between', padding: '12px', width: '100%', 
                   background: currentChatId === chat.id ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                   boxShadow: currentChatId === chat.id ? 'var(--shadow-3d-pressed)' : 'var(--shadow-3d-button)',
                   color: currentChatId === chat.id ? 'var(--accent-color)' : 'var(--text-primary)'
                 }}>
              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <MessageSquare size={16} style={{ marginRight: '10px', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
              </div>
              <Trash2 size={14} className="delete-icon" onClick={(e) => deleteChat(e, chat.id)} style={{ cursor: 'pointer', opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <header className="glass-panel" style={{ padding: '16px 24px', margin: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-3d" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ padding: '8px', display: !isMobile ? 'none' : 'block' }}>
              <Menu size={20} />
            </button>
            <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="NV AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(99, 102, 241, 0.2)' }}>NV AI</h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn-3d" onClick={() => setIsComparisonMode(!isComparisonMode)} style={{ color: isComparisonMode ? 'var(--accent-color)' : 'var(--text-primary)' }}>
              <SplitSquareHorizontal size={18} style={{ marginRight: '8px' }} />
              <span className="hide-mobile">{isComparisonMode ? "Comparison On" : "Compare"}</span>
            </button>

            <button className="btn-3d" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentMessages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.8 }}>
              <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', maxWidth: '500px' }}>
                <div className="orb-container">
                  <div className="premium-ring pring1"></div>
                  <div className="premium-ring pring2"></div>
                  <div className="premium-ring pring3"></div>
                  <div className="premium-core"></div>
                </div>
                <h2>Welcome to NV AI</h2>
                <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Experience 3D aesthetics, side-by-side AI comparison, and a lightning-fast interface.</p>
              </div>
            </div>
          ) : (
            currentMessages.map((m, i) => (
              <div key={i} className="animate-fade-in" style={{ display: 'flex', gap: '16px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', maxWidth: isComparisonMode && m.role === 'assistant' ? '100%' : '800px', margin: m.role === 'user' ? '0 0 0 auto' : '0 auto 0 0', width: '100%' }}>
                
                <div className="glass-panel" style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.role === 'user' ? 'var(--bg-tertiary)' : 'var(--accent-color)', color: 'white' }}>
                  {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>

                {isComparisonMode && m.role === 'assistant' ? (
                  <div className="comparison-grid" style={{ flex: 1 }}>
                    <div className="bubble-ai" style={{ padding: '24px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-color)', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedModel1Data.icon} {selectedModel1Data.name}
                      </div>
                      <div style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    </div>
                    <div className="bubble-ai" style={{ padding: '24px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-color)', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedModel2Data.icon} {selectedModel2Data.name}
                      </div>
                      <div style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{m.content2}</div>
                    </div>
                  </div>
                ) : (
                  <div className={m.role === 'user' ? "bubble-user" : "bubble-ai"} style={{ padding: '20px 24px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <div style={{ padding: '24px', position: 'relative' }}>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <button className="btn-3d" onClick={() => setIsDropdown1Open(!isDropdown1Open)}>
                {selectedModel1Data.icon}
                <span style={{ margin: '0 8px' }}>{selectedModel1Data.name}</span>
                <ChevronDown size={14} />
              </button>
              {isDropdown1Open && (
                <div className="glass-panel" style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', width: '250px', zIndex: 20, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {models.map(m => (
                    <button key={m.id} className="btn-3d" style={{ width: '100%', justifyContent: 'flex-start', boxShadow: 'none' }} onClick={() => { setModel1(m.id); setIsDropdown1Open(false); }}>
                      {m.icon}
                      <span style={{ marginLeft: '12px' }}>{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isComparisonMode && (
              <div style={{ position: 'relative' }}>
                <button className="btn-3d" onClick={() => setIsDropdown2Open(!isDropdown2Open)} style={{ background: 'var(--bg-tertiary)' }}>
                  {selectedModel2Data.icon}
                  <span style={{ margin: '0 8px' }}>VS: {selectedModel2Data.name}</span>
                  <ChevronDown size={14} />
                </button>
                {isDropdown2Open && (
                  <div className="glass-panel" style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', width: '250px', zIndex: 20, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {models.map(m => (
                      <button key={m.id} className="btn-3d" style={{ width: '100%', justifyContent: 'flex-start', boxShadow: 'none' }} onClick={() => { setModel2(m.id); setIsDropdown2Open(false); }}>
                        {m.icon}
                        <span style={{ marginLeft: '12px' }}>{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <input
              className="input-3d"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isComparisonMode ? "Ask both AIs simultaneously..." : "Message NV AI..."}
              disabled={isLoading}
              style={{ paddingRight: '60px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn-primary-3d"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '10px', borderRadius: '12px', minWidth: '44px' }}
            >
              {isLoading ? <div className="loader" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (max-width: 768px) { .hide-mobile { display: none; } }
        .chat-item .delete-icon { opacity: 0; transition: opacity 0.2s; }
        .chat-item:hover .delete-icon { opacity: 1; }
      `}} />
      </div>
    </div>
  );
}
