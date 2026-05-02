import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

export default function ChatRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversation');
  const livestockId = urlParams.get('livestock');

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [livestockName, setLivestockName] = useState('');
  const [otherPerson, setOtherPerson] = useState('');
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
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
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convoError) {
        console.error('Error loading conversation:', convoError);
        navigate('/ChatList');
        return;
      }

      // Get livestock name
      if (convo.livestock_id) {
        const { data: livestockData } = await supabase
          .from('livestock')
          .select('name')
          .eq('id', convo.livestock_id)
          .single();
        if (livestockData) setLivestockName(livestockData.name);
      }

      // Get other person's name
      const otherUserId = convo.buyer_id === user.id ? convo.seller_id : convo.buyer_id;
      if (otherUserId) {
        // Try profiles first
        let { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', otherUserId)
          .maybeSingle();

        if (profileData?.full_name) {
          setOtherPerson(profileData.full_name);
        } else if (profileData?.email) {
          setOtherPerson(profileData.email.split('@')[0]);
        } else {
          // Fallback to email from auth
          setOtherPerson('Farmer');
        }
      }

      // Load messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(messagesData || []);

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

      setIsLoading(false);
    };

    loadData();
  }, [user, conversationId, navigate]);

  // Real-time subscription for new messages
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

  // Typing indicator
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
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/ChatList">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-base">{otherPerson || 'Farmer'}</h1>
            <p className="text-xs text-muted-foreground">Re: {livestockName || 'Livestock'}</p>
          </div>
          <Link to={`/BreedDetails?id=${livestockId}`}>
            <Button variant="outline" size="sm">
              View Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 overflow-y-auto">
        <div className="space-y-3">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isOwn ? 'order-1' : 'order-2'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                    }`}>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && msg.is_read && <span className="ml-1">✓✓</span>}
                  </p>
                </div>
              </div>
            );
          })}
          {otherIsTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2">
                <p className="text-sm text-muted-foreground">Typing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onKeyDown={sendTypingIndicator}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}