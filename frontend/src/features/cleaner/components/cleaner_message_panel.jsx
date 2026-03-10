import React, { useEffect, useRef, useState } from 'react';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { formatCleanerChatTime, useCleanerChat } from '../hooks/useCleanerChat';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CleanerMessagePanel = ({ threadId, customerName, subtitle }) => {
  const { messages, sendMessage, editMessage, markAsRead, isConnected } = useCleanerChat({ threadId });
  const [draftMessage, setDraftMessage] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [inputError, setInputError] = useState('');
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  // Context menu state: { id, x, y } or null
  const [contextMenu, setContextMenu] = useState(null);
  const editInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingAttachment]);

  // Emit message:read when chat is viewed
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [threadId]);

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
        preview
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

  const handleSend = () => {
    const result = sendMessage({
      text: draftMessage,
      attachment: pendingAttachment
    });

    if (!result.success) {
      setInputError(result.error);
      return;
    }

    setDraftMessage('');
    setPendingAttachment(null);
    setInputError('');
  };

  return (
    <section className="my-jobs-chat-panel">
      <div className="my-jobs-chat-header">
        <div className="my-jobs-chat-customer">
          <div className="my-jobs-chat-avatar-wrap">
            <div className="my-jobs-chat-avatar">{customerName.charAt(0)}</div>
            <span className="my-jobs-chat-online-dot" />
          </div>
          <div>
            <h3>{customerName}</h3>
            <p>{subtitle}</p>
          </div>
        </div>

        <button type="button" className="my-jobs-chat-info-btn" aria-label="Job info">
          <InfoCircleOutlined />
        </button>
      </div>

      <div className="my-jobs-chat-body" ref={chatBodyRef}>
        <div className="my-jobs-chat-day-pill">TODAY</div>

        {messages.map((message) => {
          const isCleaner = message.sender === 'cleaner';
          const isEditing = editingId === message.id;

          return (
            <div key={message.id} className={`my-jobs-chat-row ${isCleaner ? 'right' : 'left'}`}>
              {!isCleaner && (
                <div className="my-jobs-chat-mini-avatar">{customerName.charAt(0)}</div>
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
