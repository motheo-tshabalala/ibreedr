import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";

export default function ChatList() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.href = '/login';
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      setIsLoading(true);
      const { data } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });
      setConversations(data || []);
      setIsLoading(false);
    };
    loadConversations();
    const subscription = supabase.channel('chat-updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadConversations()).subscribe();
    return () => subscription.unsubscribe();
  }, [user]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Browse listings and message sellers</p>
            <Link to="/Browse"><Button>Browse Listings</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((convo) => (
              <Link to={`/ChatRoom?conversation=${convo.id}&livestock=${convo.livestock_id}`} key={convo.id}>
                <Card className="cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-base">{convo.other_user_name || 'Farmer'}</h3>
                            <p className="text-xs text-muted-foreground">Re: {convo.livestock_name}</p>
                          </div>
                          {convo.last_message_at && <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatTime(convo.last_message_at)}</span>}
                        </div>
                        {convo.last_message && <p className="text-sm text-muted-foreground truncate mt-1">{convo.last_message}</p>}
                      </div>
                      {convo.unread_count > 0 && <Badge className="flex-shrink-0 bg-primary text-white">{convo.unread_count}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}