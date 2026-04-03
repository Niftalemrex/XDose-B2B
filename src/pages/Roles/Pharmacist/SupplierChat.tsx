import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '../../../context/UserContext';
import { supabaseAdmin } from '../../../lib/supabase';
import ChatBox from './ChatBox';
import './SupplierChat.css';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  read?: boolean;
}

interface Conversation {
  id: string; // composite key: `${productId}|${customerId}`
  productId: string | null;
  productName: string;
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastTimestamp: Date;
  unreadCount: number;
}

// Helper functions
const formatTime = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return msgDate.toLocaleDateString(undefined, { weekday: 'short' });
  return msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getInitials = (name: string): string => name.charAt(0).toUpperCase();

// Conversation item component
const ConversationItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}> = ({ conversation, isActive, onClick }) => {
  const timeStr = formatTime(conversation.lastTimestamp);
  return (
    <li className={`conversation-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="conv-avatar">{getInitials(conversation.customerName)}</div>
      <div className="conv-details">
        <div className="conv-header">
          <span className="conv-name">{conversation.customerName}</span>
          <span className="conv-time">{timeStr}</span>
        </div>
        <div className="conv-preview">
          <span className="conv-product">{conversation.productName}</span>
          <span className="conv-last-message">{conversation.lastMessage.slice(0, 40)}</span>
        </div>
        {conversation.unreadCount > 0 && (
          <span className="unread-badge">{conversation.unreadCount}</span>
        )}
      </div>
    </li>
  );
};

// Main component
const SupplierChat: React.FC = () => {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data: messagesData, error: msgError } = await supabaseAdmin
          .from('chats')
          .select('id, text, timestamp, sender_id, receiver_id, product_id, read')
          .eq('receiver_id', user.id)
          .order('timestamp', { ascending: false });
        if (msgError) throw msgError;

        if (!messagesData || messagesData.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const convMap = new Map<string, Conversation>();
        const productIds = new Set<string>();
        const customerIds = new Set<string>();

        for (const msg of messagesData) {
          const productId = msg.product_id;
          if (productId) productIds.add(productId);
          customerIds.add(msg.sender_id);
          const key = `${productId || 'null'}|${msg.sender_id}`;
          if (!convMap.has(key)) {
            convMap.set(key, {
              id: key,
              productId: productId,
              productName: 'Loading...',
              customerId: msg.sender_id,
              customerName: 'Loading...',
              lastMessage: msg.text,
              lastTimestamp: new Date(msg.timestamp),
              unreadCount: msg.read ? 0 : 1,
            });
          } else {
            const existing = convMap.get(key)!;
            const msgTime = new Date(msg.timestamp);
            if (msgTime > existing.lastTimestamp) {
              existing.lastMessage = msg.text;
              existing.lastTimestamp = msgTime;
            }
            if (!msg.read) existing.unreadCount++;
          }
        }

        // Fetch product names
        const productNameMap = new Map<string, string>();
        if (productIds.size > 0) {
          const { data: productsData } = await supabaseAdmin
            .from('products')
            .select('id, name')
            .in('id', Array.from(productIds));
          if (productsData) productsData.forEach(p => productNameMap.set(p.id, p.name));
        }

        // Fetch customer names
        const customerNameMap = new Map<string, string>();
        if (customerIds.size > 0) {
          const { data: usersData } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .in('id', Array.from(customerIds));
          if (usersData) usersData.forEach(u => customerNameMap.set(u.id, u.name));
        }

        for (const conv of convMap.values()) {
          conv.productName = conv.productId ? productNameMap.get(conv.productId) || 'Unknown Product' : 'No product';
          conv.customerName = customerNameMap.get(conv.customerId) || 'Unknown User';
        }

        const convList = Array.from(convMap.values())
          .sort((a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime());
        setConversations(convList);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  // Fetch messages for selected conversation and mark them as read
  useEffect(() => {
    if (!selectedConv || !user) return;

    const fetchMessages = async () => {
      try {
        let filter = `(sender_id.eq.${selectedConv.customerId},receiver_id.eq.${user.id})`;
        if (selectedConv.productId) {
          filter = `product_id.eq.${selectedConv.productId},and(${filter},(sender_id.eq.${user.id},receiver_id.eq.${selectedConv.customerId}))`;
        } else {
          filter = `or(${filter},(sender_id.eq.${user.id},receiver_id.eq.${selectedConv.customerId}))`;
        }
        const { data, error } = await supabaseAdmin
          .from('chats')
          .select('*')
          .or(filter)
          .order('timestamp', { ascending: true });
        if (error) throw error;

        const formatted = data.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.sender_id,
          senderName: msg.sender_id === user.id ? 'You' : selectedConv.customerName,
          timestamp: new Date(msg.timestamp),
          read: msg.read,
        }));
        setMessages(formatted);

        // Mark all messages in this conversation as read
        const unreadIds = data.filter(m => !m.read && m.receiver_id === user.id).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabaseAdmin
            .from('chats')
            .update({ read: true })
            .in('id', unreadIds);
          // Update unread count in conversations list
          setConversations(prev =>
            prev.map(c =>
              c.id === selectedConv.id ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabaseAdmin
      .channel(`supplier-chat-${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: selectedConv.productId
            ? `product_id=eq.${selectedConv.productId}`
            : `and(sender_id.eq.${selectedConv.customerId},receiver_id.eq.${user.id})`,
        },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === selectedConv.customerId && newMsg.receiver_id === user.id) ||
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedConv.customerId)
          ) {
            const message: Message = {
              id: newMsg.id,
              text: newMsg.text,
              senderId: newMsg.sender_id,
              senderName: newMsg.sender_id === user.id ? 'You' : selectedConv.customerName,
              timestamp: new Date(newMsg.timestamp),
              read: newMsg.read,
            };
            setMessages(prev => [...prev, message]);
            // Update conversation list with new last message
            setConversations(prev =>
              prev.map(c =>
                c.id === selectedConv.id
                  ? { ...c, lastMessage: newMsg.text, lastTimestamp: new Date(newMsg.timestamp) }
                  : c
              )
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabaseAdmin.removeChannel(subscription);
    };
  }, [selectedConv, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!selectedConv || !user) return;
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text,
      senderId: user.id,
      senderName: 'You',
      timestamp: new Date(),
      read: true, // sent messages are read by sender
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const { error } = await supabaseAdmin.from('chats').insert({
        sender_id: user.id,
        receiver_id: selectedConv.customerId,
        product_id: selectedConv.productId,
        sender_type: 'contact',
        text,
        read: true,
      });
      if (error) throw error;
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(
      conv =>
        conv.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  if (loading) return <div className="supplier-chat-loading">Loading conversations...</div>;

  return (
    <div className="supplier-chat-container">
      <div className="conversation-list">
        <div className="conversation-header">
          <h3>Conversations</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by product or customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">No conversations found.</div>
        ) : (
          <ul>
            {filteredConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={selectedConv?.id === conv.id}
                onClick={() => setSelectedConv(conv)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="chat-area">
        {selectedConv ? (
          <>
            <div className="chat-header">
              <div className="chat-contact-info">
                <div className="contact-avatar">{getInitials(selectedConv.customerName)}</div>
                <div>
                  <h3>{selectedConv.customerName}</h3>
                  <p className="product-info">About: {selectedConv.productName}</p>
                </div>
              </div>
            </div>
            <ChatBox
              messages={messages}
              currentUser={{ id: user?.id || '', name: 'You' }}
              contactName={selectedConv.customerName}
              onSend={handleSend}
              isTyping={isTyping}
            />
            <div ref={chatEndRef} />
          </>
        ) : (
          <div className="no-conversation">Select a conversation to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default SupplierChat;