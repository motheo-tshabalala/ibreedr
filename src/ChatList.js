import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { supabase } from './supabaseClient';

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

      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          *,
          livestock:livestock_id (name, images),
          buyer:buyer_id (email),
          seller:seller_id (email)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
      } else {
        const convosWithUnread = await Promise.all((convos || []).map(async (convo) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return { ...convo, unread_count: count || 0 };
        }));
        setConversations(convosWithUnread);
      }

      setIsLoading(false);
    };

    loadConversations();

    const subscription = supabase
      .channel('chat-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => loadConversations()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user]);

  const getOtherPerson = (convo) => {
    if (convo.buyer_id === user?.id) {
      return convo.seller?.email || 'Seller';
    }
    return convo.buyer?.email || 'Buyer';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
            <ArrowLeft className="w-6 h-6 text-stone-800 cursor-pointer" />
          </Link>
          <h1 className="text-xl font-bold text-stone-800">Messages</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-800 mb-2">No messages yet</h3>
            <p className="text-stone-500">Browse listings and message sellers</p>
            <Link to="/Browse">
              <button className="mt-6 bg-amber-500 text-white rounded-full px-6 py-2">
                Browse Listings
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo) => (
              <Link to={`/ChatRoom?conversation=${convo.id}&livestock=${convo.livestock_id}`} key={convo.id}>
                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-stone-800 truncate">
                        {convo.livestock?.name || 'Livestock'}
                      </h3>
                      {convo.unread_count > 0 && (
                        <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 truncate">
                      {getOtherPerson(convo)}
                    </p>
                    {convo.last_message && (
                      <p className="text-xs text-stone-400 truncate mt-1">
                        {convo.last_message}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}