'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MapPin, Briefcase, Signal, GraduationCap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function KopanoChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Sawubona! I'm Kopano, your Ubuntu Town AI assistant. I can help you with:\n\n• Finding opportunities (jobs, internships, bursaries)\n• Building and improving your CV\n• Connecting with town coordinators\n• Reporting community signals\n• Learning about town services\n\nHow can I help you today?",
      timestamp: new Date(),
      suggestions: ['Help me find opportunities', 'Build my CV', 'Report a signal'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (userMessage: string): Message => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('opportunity') || lower.includes('job') || lower.includes('internship')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I found several opportunities for you:\n\n📋 **Youth Employment Initiative** - Various roles available\n💼 **SAPS Internship Program** - Application deadline: Feb 1\n🎓 **Tech Skills Academy** - Free coding training\n🌾 **Agricultural Training Grant** - For rural communities\n\nWould you like details on any of these? I can also help you prepare your application.",
        timestamp: new Date(),
        suggestions: ['Apply to SAPS program', 'Tell me about Tech Skills', 'Help me prepare application'],
      };
    }
    
    if (lower.includes('cv') || lower.includes('resume') || lower.includes('cv')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Let's build your CV! I'll guide you through:\n\n1️⃣ **Personal Information** - Name, contact, location\n2️⃣ **Objective Statement** - Career goals\n3️⃣ **Education** - Schools, qualifications\n4️⃣ **Experience** - Work history, volunteer\n5️⃣ **Skills** - Technical and soft skills\n6️⃣ **References** - Community connections\n\nWhat section would you like to start with?",
        timestamp: new Date(),
        suggestions: ['Start with personal info', 'Write objective statement', 'Add education'],
      };
    }
    
    if (lower.includes('signal') || lower.includes('report') || lower.includes('issue')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I can help you submit a community signal. Please tell me:\n\n• **What type of issue?** (infrastructure, safety, education, health, economic)\n• **Where is it located?** (town/village name)\n• **Describe the problem** (as detailed as possible)\n\nYour signal will be reviewed by town coordinators and we'll work to address it.",
        timestamp: new Date(),
        suggestions: ['Road damage', 'Safety concern', 'Water problem', 'Electricity issue'],
      };
    }
    
    if (lower.includes('coordinator') || lower.includes('contact') || lower.includes('meet')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Your town coordinators are ready to help:\n\n👥 **Active Coordinators** - We have coordinators in most towns\n📞 **Phone Support** - Available during business hours\n🤝 **Role** - They connect you with opportunities and services\n\nWould you like me to connect you with a specific coordinator or help you find one in your town?",
        timestamp: new Date(),
        suggestions: ['Find coordinator in my town', 'How to become a coordinator', 'Contact coordinator'],
      };
    }
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: "I appreciate your question. Let me help you with Ubuntu Town services:\n\n• **Town Information** - Learn about your local town\n• **Opportunities** - Find jobs, internships, training\n• **CV Building** - Get help creating your CV\n• **Signals** - Report community issues\n• **Coordinators** - Connect with local support\n\nWhat would you like to explore?",
      timestamp: new Date(),
      suggestions: ['Tell me about opportunities', 'Help with my CV', 'Report a signal'],
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getResponse(userMessage.content);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light flex flex-col">
      {/* Header */}
      <div className="border-b border-ubuntu-border bg-ubuntu-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ubuntu-orange to-ubuntu-purple flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ubuntu-light">Kopano AI</h1>
              <p className="text-sm text-muted-foreground">Your Ubuntu Town Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ubuntu-orange to-ubuntu-purple flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-ubuntu-purple/20 border-ubuntu-purple/30' : 'bg-ubuntu-card border-ubuntu-border'} border rounded-xl p-4`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.suggestions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestion(suggestion)}
                        className="text-xs bg-ubuntu-dark border border-ubuntu-border rounded-full px-3 py-1 hover:border-ubuntu-orange hover:text-ubuntu-orange transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-ubuntu-orange flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ubuntu-orange to-ubuntu-purple flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-ubuntu-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-ubuntu-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-ubuntu-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-ubuntu-border bg-ubuntu-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Kopano anything about Ubuntu Town..."
              className="flex-1 bg-ubuntu-dark border border-ubuntu-border rounded-xl px-4 py-3 text-ubuntu-light placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-orange"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-ubuntu-orange text-ubuntu-dark rounded-xl px-6 py-3 font-semibold hover:bg-ubuntu-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
