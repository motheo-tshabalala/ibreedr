import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function ChatRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversation');
  const livestockId = urlParams.get('livestock');

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [livestock, setLivestock] = useState(null);
  const [otherPerson, setOtherPerson] = useState(null);
  const [, setIsTyping] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.href = '/login';
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user || !conversationId) return;

    const loadData = async () => {
      setIsLoading(true);

      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .select(`
          *,
          livestock:livestock_id (name, images),
          buyer:buyer_id (email, full_name),
          seller:seller_id (email, full_name)
        `)
        .eq('id', conversationId)
        .single();

      if (convoError) {
        console.error('Error loading conversation:', convoError);
        navigate('/ChatList');
        return;
      }

      setLivestock(convo.livestock);

      const other = convo.buyer_id === user.id ? convo.seller : convo.buyer;
      setOtherPerson(other);

      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!msgError) {
        setMessages(messagesData || []);
      }

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

      setIsLoading(false);
    };

    loadData();
  }, [user, conversationId, navigate]);

  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`room-${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => [...prev, newMsg]);

          if (newMsg.sender_id !== user?.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const typingChannel = supabase.channel(`typing-${conversationId}`);

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user_id !== user.id) {
          setOtherIsTyping(true);
          setTimeout(() => setOtherIsTyping(false), 2000);
        }
      })
      .subscribe();

    return () => typingChannel.unsubscribe();
  }, [conversationId, user]);

  const sendTypingIndicator = () => {
    if (!conversationId || !user) return;

    supabase.channel(`typing-${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id }
    });
  };

  const handleTyping = () => {
    setIsTyping(true);
    sendTypingIndicator();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: parseInt(conversationId),
        sender_id: user.id,
        message: newMessage,
        is_read: false
      }]);

    if (!error) {
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage,
          last_message_at: new Date()
        })
        .eq('id', conversationId);

      setNewMessage('');
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/ChatList">
            <ArrowLeft className="w-6 h-6 text-stone-800 cursor-pointer" />
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-stone-800">{livestock?.name || 'Chat'}</h1>
            <p className="text-xs text-stone-500">{otherPerson?.email?.split('@')[0] || 'Seller'}</p>
          </div>
          <Link to={`/BreedDetails?id=${livestockId}`}>
            <button className="text-sm text-amber-600">View Listing</button>
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 overflow-y-auto">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.sender_id === user.id
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-white text-stone-800 rounded-bl-sm shadow-sm'
                }`}>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-amber-100' : 'text-stone-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender_id === user.id && msg.is_read && (
                    <span className="ml-1">✓✓</span>
                  )}
                </p>
              </div>
            </div>
          ))}
          {otherIsTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                <p className="text-sm text-stone-400">Typing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-1 border border-stone-200 rounded-full px-4 py-2 focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-amber-500 text-white rounded-full p-2 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}