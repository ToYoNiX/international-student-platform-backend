import React, { useEffect, useMemo, useState } from 'react';
import { useFetchClient } from '@strapi/admin/strapi-admin';
import {
  Box,
  Button,
  Flex,
  Main,
  Textarea,
  Typography,
} from '@strapi/design-system';

const App = () => {
  const { get, post } = useFetchClient();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const loadConversations = async () => {
    setLoadingConversations(true);
    setError('');

    try {
      const payload = await get('/chat-inbox/conversations');
      const list = Array.isArray(payload?.data?.data)
        ? payload.data.data
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      setConversations(list);

      if (list.length > 0 && !selectedConversationId) {
        setSelectedConversationId(list[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError('');

    try {
      const payload = await get(`/chat-inbox/conversations/${conversationId}/messages`);
      const list = Array.isArray(payload?.data?.data)
        ? payload.data.data
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      setMessages(list);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  const onSend = async () => {
    const body = draft.trim();
    if (!selectedConversationId || !body || sending) {
      return;
    }

    setSending(true);
    setError('');

    try {
      await post(`/chat-inbox/conversations/${selectedConversationId}/messages`, { data: { body } });
      setDraft('');
      await loadMessages(selectedConversationId);
      await loadConversations();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (value) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString();
  };

  return (
    <Main>
      <Box padding={8}>
        <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
          <Typography variant="alpha">Chat Inbox</Typography>
          <Button variant="secondary" onClick={loadConversations} loading={loadingConversations}>
            Refresh
          </Button>
        </Flex>

        {error ? (
          <Box marginBottom={4} padding={3} background="danger100" hasRadius>
            <Typography textColor="danger700">{error}</Typography>
          </Box>
        ) : null}

        <Flex gap={4} alignItems="flex-start" style={{ flexWrap: 'wrap' }}>
          <Box width="100%" style={{ maxWidth: 360 }} borderColor="neutral200" borderWidth="1px" borderStyle="solid" hasRadius padding={2}>
              <Typography variant="beta">Conversations</Typography>
              <Box paddingTop={2}>
                {conversations.map((conversation) => {
                  const active = conversation.id === selectedConversationId;
                  const name =
                    conversation?.frontendUser?.displayName ||
                    conversation?.frontendUser?.username ||
                    conversation?.frontendUser?.email ||
                    `User #${conversation?.frontendUser?.id || 'unknown'}`;

                  return (
                    <Box
                      key={conversation.id}
                      marginBottom={2}
                      padding={2}
                      background={active ? 'primary100' : 'neutral100'}
                      hasRadius
                    >
                      <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => setSelectedConversationId(conversation.id)}
                      >
                        <Flex justifyContent="space-between" width="100%">
                          <Typography>{name}</Typography>
                          {conversation.unreadForAdmin > 0 ? (
                            <Typography textColor="danger600">{conversation.unreadForAdmin}</Typography>
                          ) : null}
                        </Flex>
                      </Button>
                    </Box>
                  );
                })}

                {!loadingConversations && conversations.length === 0 ? (
                  <Typography textColor="neutral600">No conversations yet.</Typography>
                ) : null}
              </Box>
            </Box>

          <Box flex="1" width="100%" borderColor="neutral200" borderWidth="1px" borderStyle="solid" hasRadius padding={2}>
              <Typography variant="beta">
                {selectedConversation
                  ? `Conversation #${selectedConversation.id}`
                  : 'Select a conversation'}
              </Typography>

              <Box
                marginTop={3}
                padding={2}
                background="neutral100"
                hasRadius
                style={{ minHeight: 360, maxHeight: 420, overflowY: 'auto' }}
              >
                {loadingMessages ? (
                  <Typography textColor="neutral600">Loading messages...</Typography>
                ) : null}

                {!loadingMessages && messages.length === 0 ? (
                  <Typography textColor="neutral600">No messages in this thread.</Typography>
                ) : null}

                {messages.map((message) => (
                  <Box
                    key={message.id}
                    marginBottom={3}
                    paddingBottom={2}
                    borderColor="neutral200"
                    borderStyle="solid"
                    borderWidth="0 0 1px 0"
                  >
                    <Typography style={{ display: 'block' }}>
                      <span style={{ fontWeight: 700 }}>
                        {message.senderType === 'admin' ? 'Admin:' : 'User:'}
                      </span>{' '}
                      {message.body}
                    </Typography>
                    <Typography
                      textColor="neutral600"
                      style={{ display: 'block', marginTop: 4, fontSize: 12 }}
                    >
                      {formatMessageTime(message.createdAt || message.updatedAt)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box marginTop={3}>
                <Textarea
                  label="Reply"
                  name="reply"
                  placeholder="Type a response"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Flex justifyContent="flex-end" marginTop={2}>
                  <Button onClick={onSend} loading={sending} disabled={!selectedConversationId || !draft.trim()}>
                    Send
                  </Button>
                </Flex>
              </Box>
            </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export default App;
