import React, { useEffect, useRef, useState } from 'react';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  InfoCircleOutlined,
  SoundOutlined,
  AudioMutedOutlined,
  PlusCircleOutlined,
  SendOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import { Modal, message } from 'antd';
import { formatCleanerChatTime, useCleanerChat } from '../hooks/useCleanerChat';
import { useChatStore } from '../../../store/chatStore';
import api from '../../../services/api';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CleanerMessagePanel = ({ 
  threadId, 
  customerName, 
  subtitle, 
  customerId, 
  customerAvatar,
  customerPhone,
  customerEmail
}) => {
  const { messages, sendMessage, editMessage, markAsRead, isConnected, isLoading, showLoadingIndicator, isCustomerTyping, notifyTyping, otherUserId } = useCleanerChat({ threadId, receiverId: customerId });
  const soundEnabled = useChatStore((state) => state.soundEnabled);
  const toggleSound = useChatStore((state) => state.toggleSound);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const isOtherOnline = otherUserId ? Boolean(onlineUsers[String(otherUserId)]) : true;
  const [draftMessage, setDraftMessage] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [inputError, setInputError] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  // Context menu state: { id, x, y } or null
  const [contextMenu, setContextMenu] = useState(null);
  // Block/Delete state
  const [isBlocked, setIsBlocked] = useState(false);
  const [iBlocked, setIBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const editInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const lastReadReceiptRef = useRef({ threadId: null, messageId: null });
  const customerInitial = String(customerName || 'C').trim().charAt(0).toUpperCase() || 'C';

  // Fetch block status on mount
  useEffect(() => {
    const fetchBlockStatus = async () => {
      try {
        const response = await api.get(`/messages/booking/${threadId}/block-status`);
        if (response.data?.success) {
          setIsBlocked(response.data.data.is_blocked);
          setIBlocked(response.data.data.cleaner_blocked);
        }
      } catch (error) {
        console.error('Failed to fetch block status:', error);
      }
    };
    if (threadId) {
      fetchBlockStatus();
    }
  }, [threadId]);

  // Handle block/unblock chat
  const handleToggleBlock = async () => {
    try {
      setBlockLoading(true);
      const response = await api.patch(`/messages/booking/${threadId}/block`);
      if (response.data?.success) {
        setIBlocked(response.data.data.blocked);
        message.success(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update block status');
    } finally {
      setBlockLoading(false);
    }
  };

  // Handle delete chat
  const handleDeleteChat = () => {
    Modal.confirm({
      title: 'Delete Chat',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete all messages in this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await api.delete(`/messages/booking/${threadId}`);
          if (response.data?.success) {
            message.success('Chat deleted successfully');
            // Reload the page or trigger a refresh
            window.location.reload();
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete chat');
        }
      }
    });
  };

  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    console.log('[cleaner_message_panel] Messages updated, scrolling to bottom. Count:', messages.length);
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    // Only scroll when message count changes (new msg) or attachment is added
  }, [messages.length, pendingAttachment]);

  // Emit message:read (and persist) when chat is viewed or when a new incoming message arrives.
  useEffect(() => {
    if (!messages.length) return;

    const lastIncoming = [...messages].reverse().find((m) => m?.sender && m.sender !== 'cleaner');
    const messageId = lastIncoming?.id ? String(lastIncoming.id) : null;
    if (!messageId) return;

    if (
      lastReadReceiptRef.current.threadId === String(threadId) &&
      lastReadReceiptRef.current.messageId === messageId
    ) {
      return;
    }

    lastReadReceiptRef.current = { threadId: String(threadId), messageId };
    markAsRead({ messageId });
  }, [threadId, messages.length, markAsRead]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const clearPendingAttachment = () => {
    setPendingAttachment(null);
  };

  const handleFiles = async (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setInputError('Please choose an image file.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setInputError('Please choose an image smaller than 2MB.');
      return;
    }

    try {
      const preview = await toDataUrl(file);
      setPendingAttachment({
        name: file.name,
        preview,
        file
      });
      setInputError('');
    } catch {
      setInputError('Unable to load that image.');
    }
  };

  // Focus the edit input whenever editingId changes.
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      const len = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [editingId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const handleBubbleContextMenu = (e, message) => {
    if (message.sender !== 'cleaner' || !message.text) return;
    e.preventDefault();
    setContextMenu({ id: message.id, text: message.text, x: e.clientX, y: e.clientY });
  };

  const startEdit = (message) => {
    setContextMenu(null);
    setEditingId(message.id);
    setEditDraft(message.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const commitEdit = () => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    editMessage({ id: editingId, text: trimmed });
    setEditingId(null);
    setEditDraft('');
  };

  const handleSend = async () => {
    console.log('[cleaner_message_panel] handleSend called');
    
    const textToSend = draftMessage;
    const attachmentToSend = pendingAttachment;

    // 1. Clear UI immediately for better UX (Optimistic clear)
    setDraftMessage('');
    setPendingAttachment(null);
    setInputError('');

    // 2. Send in background
    const result = await sendMessage({
      text: textToSend,
      attachment: attachmentToSend
    });

    // 3. Handle Failure: Restore draft so user doesn't lose it
    if (!result.success) {
      setInputError(result.error);
      setDraftMessage(textToSend);
      if (attachmentToSend) setPendingAttachment(attachmentToSend);
    }
  };

  return (
    <section className="my-jobs-chat-panel">
      <div className="my-jobs-chat-header">
        <div className="my-jobs-chat-customer">
          <div className="my-jobs-chat-avatar-wrap">
            <div className="my-jobs-chat-avatar">
              {customerAvatar ? (
                <img
                  src={customerAvatar}
                  alt={customerName}
                  className="my-jobs-chat-avatar-image"
                />
              ) : (
                customerName.charAt(0)
              )}
            </div>
            <span className={`my-jobs-chat-online-dot ${isOtherOnline ? 'online' : 'offline'}`} />
          </div>
          <div className="my-jobs-customer-info">
            <h3>{customerName}</h3>
            {(customerPhone || customerEmail) && (
              <div className="my-jobs-customer-details">
                {customerPhone && (
                  <span><PhoneOutlined /> {customerPhone}</span>
                )}
                {customerEmail && (
                  <span><MailOutlined /> {customerEmail}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="my-jobs-chat-header-actions">
          <button
            type="button"
            className="my-jobs-chat-sound-btn"
            aria-label={soundEnabled ? 'Mute chat sounds' : 'Enable chat sounds'}
            onClick={toggleSound}
          >
            {soundEnabled ? <SoundOutlined /> : <AudioMutedOutlined />}
          </button>
          <button
            type="button"
            className="my-jobs-chat-sound-btn"
            aria-label={iBlocked ? 'Unblock chat' : 'Block chat'}
            onClick={handleToggleBlock}
            loading={blockLoading}
            style={{ color: iBlocked ? '#ff4d4f' : undefined }}
          >
            {iBlocked ? <UnlockOutlined /> : <LockOutlined />}
          </button>
          <button
            type="button"
            className="my-jobs-chat-sound-btn"
            aria-label="Delete chat"
            onClick={handleDeleteChat}
            style={{ color: '#ff4d4f' }}
          >
            <DeleteOutlined />
          </button>
          <button type="button" className="my-jobs-chat-info-btn" aria-label="Job info">
            <InfoCircleOutlined />
          </button>
        </div>
      </div>

      <div className="my-jobs-chat-body" ref={chatBodyRef}>
        {showLoadingIndicator ? (
          <div className="my-jobs-chat-loading">
            <div className="loading-spinner" />
            <span>Loading messages...</span>
          </div>
        ) : (
          <>
            {isBlocked && (
              <div className="my-jobs-chat-blocked-banner">
                <LockOutlined />
                <span>This chat is blocked. You cannot send or receive messages.</span>
              </div>
            )}
            <div className="my-jobs-chat-day-pill">TODAY</div>

            {messages.map((message) => {
          const isCleaner = message.sender === 'cleaner';
          const isEditing = editingId === message.id;

          return (
            <div key={message.id} className={`my-jobs-chat-row ${isCleaner ? 'right' : 'left'}`}>
              {!isCleaner && (
                <div className="my-jobs-chat-mini-avatar">
                  {customerAvatar && !avatarError ? (
                    <img
                      src={customerAvatar}
                      alt={customerName}
                      className="my-jobs-chat-avatar-image"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    customerInitial
                  )}
                </div>
              )}

              <div className="my-jobs-chat-content">
                {isEditing ? (
                  <div className="my-jobs-chat-edit-wrap">
                    <input
                      ref={editInputRef}
                      className="my-jobs-chat-edit-input"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <div className="my-jobs-chat-edit-actions">
                      <button type="button" className="my-jobs-chat-edit-cancel" onClick={cancelEdit}>Cancel</button>
                      <button
                        type="button"
                        className="my-jobs-chat-edit-save"
                        onClick={commitEdit}
                        disabled={!editDraft.trim()}
                      >Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="my-jobs-chat-bubble-wrap">
                    <div
                      className="my-jobs-chat-bubble"
                      onContextMenu={(e) => handleBubbleContextMenu(e, message)}
                    >
                      {message.imageUrl && (
                        <div className="my-jobs-chat-image-wrap">
                          <img
                            src={message.imageUrl}
                            alt={message.imageName || 'Message attachment'}
                            className="my-jobs-chat-image"
                          />
                        </div>
                      )}
                      {message.text && <p className="my-jobs-chat-text">{message.text}</p>}
                    </div>
                  </div>
                )}

                <div className="my-jobs-chat-meta">
                  {message.edited && (
                    <span className="my-jobs-chat-edited">Edited</span>
                  )}
                  <span className="my-jobs-chat-time">{formatCleanerChatTime(message.createdAt)}</span>
                  {isCleaner && (() => {
                    const st = message.status;
                    if (st === 'sending') return (
                      <span className="my-jobs-chat-ticks sending" aria-label="Sending">
                        <ClockCircleOutlined />
                      </span>
                    );
                    if (st === 'sent') return (
                      <span className="my-jobs-chat-ticks sent" aria-label="Sent">
                        <CheckOutlined />
                      </span>
                    );
                    if (st === 'delivered') return (
                      <span className="my-jobs-chat-ticks delivered" aria-label="Delivered">
                        <CheckOutlined /><CheckOutlined />
                      </span>
                    );
                    if (st === 'seen') return (
                      <span className="my-jobs-chat-ticks seen" aria-label="Seen">
                        <CheckOutlined /><CheckOutlined />
                      </span>
                    );
                    return null;
                  })()}
                </div>
              </div>
            </div>
          );
        })}

        {isCustomerTyping && (
          <div className="my-jobs-chat-row left">
            <div className="my-jobs-chat-mini-avatar">
              {customerAvatar && !avatarError ? (
                <img
                  src={customerAvatar}
                  alt={customerName}
                  className="my-jobs-chat-avatar-image"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                customerInitial
              )}
            </div>
            <div className="my-jobs-chat-content">
              <div className="my-jobs-chat-bubble-wrap">
                <div className="my-jobs-chat-bubble typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        )}

        </>
        )}
      </div>

      <div className="my-jobs-chat-compose">
        {pendingAttachment && (
          <div className="my-jobs-chat-attachment-preview">
            <img src={pendingAttachment.preview} alt={pendingAttachment.name} />
            <div className="my-jobs-chat-attachment-copy">
              <strong>{pendingAttachment.name}</strong>
              <span>Ready to send</span>
            </div>
            <button
              type="button"
              className="my-jobs-chat-attachment-remove"
              aria-label="Remove image"
              onClick={clearPendingAttachment}
            >
              <CloseOutlined />
            </button>
          </div>
        )}

        {inputError && <p className="my-jobs-chat-input-error">{inputError}</p>}

        <div className="my-jobs-chat-input-row">
          <button
            type="button"
            className="my-jobs-input-add-btn"
            aria-label="Attach image"
            onClick={openFilePicker}
          >
            <PlusCircleOutlined />
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            value={draftMessage}
            onChange={(e) => {
              setDraftMessage(e.target.value);
              if (inputError) setInputError('');
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            type="button"
            className="my-jobs-input-send-btn"
            aria-label="Send"
            onClick={handleSend}
            disabled={!draftMessage.trim() && !pendingAttachment}
          >
            <SendOutlined />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="my-jobs-chat-file-input"
          onChange={async (e) => {
            await handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {contextMenu && (
        <ul
          className="my-jobs-chat-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <li>
            <button
              type="button"
              onClick={() => startEdit({ id: contextMenu.id, text: contextMenu.text })}
            >
              <EditOutlined /> Edit
            </button>
          </li>
        </ul>
      )}
    </section>
  );
};

export default CleanerMessagePanel;
