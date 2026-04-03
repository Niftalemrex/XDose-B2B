// src/pages/marketplace/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import ChatBox from '../../pages/Roles/Pharmacist/ChatBox';
import { supabaseAdmin } from '../../lib/supabase';
import './ChatPage.css';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

interface ProductDetails {
  id: string;
  name: string;
  strength: string;
  expiryDate: string;
  quantity: number;
  price: string;
  supplierId: string;
  supplierName: string;
}

const ChatPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId || !user) return;
      setError(null);

      try {
        // 1. Get product details
        const { data: productData, error: productError } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error('Product not found');

        // 2. Fetch supplier (uploader) details
        const { data: supplierData, error: supplierError } = await supabaseAdmin
          .from('users')
          .select('id, name')
          .eq('id', productData.uploaded_by)
          .single();

        if (supplierError) throw supplierError;

        // If current user is the supplier, show a message instead of chat
        if (user.id === supplierData.id) {
          setProduct({
            id: productData.id,
            name: productData.name,
            strength: productData.strength || '',
            expiryDate: productData.expiry_date,
            quantity: productData.quantity,
            price: productData.price?.toString() || '0',
            supplierId: supplierData.id,
            supplierName: supplierData.name,
          });
          setError("You are the supplier of this product. You cannot send messages to yourself.");
          setMessages([]);
          return;
        }

        setProduct({
          id: productData.id,
          name: productData.name,
          strength: productData.strength || '',
          expiryDate: productData.expiry_date,
          quantity: productData.quantity,
          price: productData.price?.toString() || '0',
          supplierId: supplierData.id,
          supplierName: supplierData.name,
        });

        // 3. Fetch messages between current user and supplier
        const orFilter = `(sender_id.eq.${user.id},receiver_id.eq.${supplierData.id}),(sender_id.eq.${supplierData.id},receiver_id.eq.${user.id})`;
        const { data: chatData, error: chatError } = await supabaseAdmin
          .from('chats')
          .select('*')
          .or(orFilter)
          .order('timestamp', { ascending: true });

        if (chatError) throw chatError;

        const formattedMessages: ChatMessage[] = (chatData || []).map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.sender_id,
          senderName: msg.sender_id === user.id ? 'You' : supplierData.name,
          timestamp: new Date(msg.timestamp),
        }));

        setMessages(formattedMessages);
      } catch (err: any) {
        console.error('Error loading chat:', err.message || err);
        setError('Failed to load chat. Please try again.');
      }
    };

    fetchData();
  }, [productId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!product || !user) return;
    if (error) return; // Don't send if error message is displayed

    const tempId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: tempId,
      text,
      senderId: user.id,
      senderName: 'You',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      const { error: insertError } = await supabaseAdmin.from('chats').insert({
        sender_id: user.id,
        receiver_id: product.supplierId,
        sender_type: 'user',
        text,
      });

      if (insertError) throw insertError;
    } catch (err: any) {
      console.error('Failed to save message:', err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (!product) return <div className="loading">Loading chat...</div>;

  return (
    <div className="chat-page-container">
      <div className="chat-header">
        <div className="contact-info">
          <div className="avatar">{product.name.charAt(0)}</div>
          <div>
            <h2>{product.supplierName}</h2>
            <div className="status">
              <span className="status-indicator online"></span>
              Online
            </div>
          </div>
        </div>
        <div className="product-info">
          <h3>{product.name} {product.strength}</h3>
          <p>Quantity: {product.quantity} | Price: {product.price}</p>
          <p>Expiry: {new Date(product.expiryDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="chat-content">
        {error ? (
          <div className="chat-error">{error}</div>
        ) : (
          <>
            <ChatBox
              messages={messages}
              currentUser={{ id: user?.id || '', name: 'You' }}
              contactName={product.supplierName}
              onSend={handleSend}
              isTyping={false}
            />
            <div ref={chatEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;