import {
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  keyframes,
} from "@mui/material";
import { MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatAssistantError, sendAssistantMessage } from "./assistant.api";
import {
  ASSISTANT_COLORS,
  STATIC_SUGGESTIONS,
  getInputPlaceholder,
  getOfflineError,
  getTagline,
  getUnavailableError,
  getWelcomeMessage,
  localFallbackAnswer,
} from "./assistant.i18n";
import type { AssistantLanguage, AssistantMessage } from "./assistant.types";
import { AssistantMessageBubble } from "./components/AssistantMessageBubble";
import { AssistantQuickReplies } from "./components/AssistantQuickReplies";
import { AssistantScreenshotCard } from "./components/AssistantScreenshotCard";
import {
  loadConversationMemory,
  saveConversationMemory,
  useAssistantContext,
} from "./useAssistantContext";

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AssistantWidget() {
  const assistantContext = useAssistantContext();
  const page = String(assistantContext.page ?? "global");

  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<AssistantLanguage>("fr");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [lastSuggestedActions, setLastSuggestedActions] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const rtl = language === "ar";

  useEffect(() => {
    conversationRef.current = loadConversationMemory(page);
    if (conversationRef.current.length > 0) {
      setShowWelcome(false);
      setMessages(
        conversationRef.current.map((turn) => ({
          id: createId(),
          role: turn.role,
          content: turn.content,
        }))
      );
    } else {
      setShowWelcome(true);
      setMessages([]);
    }
    setLastSuggestedActions([]);
    setErrorBanner(null);
  }, [page]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const persistConversation = useCallback(() => {
    saveConversationMemory(page, conversationRef.current);
  }, [page]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setErrorBanner(null);
      setShowWelcome(false);
      setLastSuggestedActions([]);

      const userMessage: AssistantMessage = { id: createId(), role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      conversationRef.current.push({ role: "user", content: trimmed });
      persistConversation();

      setLoading(true);
      try {
        const response = await sendAssistantMessage({
          message: trimmed,
          language,
          context: {
            ...assistantContext,
            conversation_memory: conversationRef.current.slice(-8),
          },
        });

        const assistantMessage: AssistantMessage = {
          id: createId(),
          role: "assistant",
          content: response.answer,
          screenshots: response.screenshots,
          suggestedActions: response.suggestedActions,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLastSuggestedActions(response.suggestedActions ?? []);
        conversationRef.current.push({ role: "assistant", content: response.answer });
        persistConversation();
      } catch (error) {
        const msg = formatAssistantError(error);
        const isUnavailable =
          msg.toLowerCase().includes("localbackend") || msg.includes("503");

        if (isUnavailable) {
          setErrorBanner(getUnavailableError(language));
        } else {
          setErrorBanner(getOfflineError(language));
        }

        const fallback = localFallbackAnswer(trimmed, language);
        const fallbackMessage: AssistantMessage = {
          id: createId(),
          role: "assistant",
          content: fallback,
        };
        setMessages((prev) => [...prev, fallbackMessage]);
        conversationRef.current.push({ role: "assistant", content: fallback });
        persistConversation();
      } finally {
        setLoading(false);
      }
    },
    [assistantContext, language, loading, persistConversation]
  );

  const handleLanguageChange = (lang: AssistantLanguage) => {
    setLanguage(lang);
    setShowWelcome(true);
    setLastSuggestedActions([]);
    setErrorBanner(null);
  };

  const handleSubmit = () => {
    const value = input;
    setInput("");
    void sendMessage(value);
  };

  return (
    <>
      {open ? (
        <Box
          sx={{
            position: "fixed",
            bottom: 94,
            right: 18,
            width: { xs: "calc(100vw - 36px)", sm: 410 },
            maxWidth: 410,
            height: { xs: "min(610px, calc(100vh - 120px))", sm: 610 },
            bgcolor: ASSISTANT_COLORS.surface,
            borderRadius: "20px",
            overflow: "hidden",
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
            border: `1px solid ${ASSISTANT_COLORS.border}`,
            animation: `${slideUp} 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: ASSISTANT_COLORS.primary,
              px: 2,
              py: 1.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                CF
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "white", fontWeight: 700, lineHeight: 1.2 }}
                  noWrap
                >
                  contentflow AI assistant
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: ASSISTANT_COLORS.online,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.76)" }}>
                    {getTagline(language)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as AssistantLanguage)}
                size="small"
                sx={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: 56,
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
                  "& .MuiSvgIcon-root": { color: "white" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
                }}
              >
                <MenuItem value="fr">FR</MenuItem>
                <MenuItem value="en">EN</MenuItem>
                <MenuItem value="ar">AR</MenuItem>
              </Select>
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <X size={18} />
              </IconButton>
            </Box>
          </Box>

          {/* Chat area */}
          <Box
            ref={chatRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              bgcolor: ASSISTANT_COLORS.bg,
              px: 1.5,
              py: 1.5,
              direction: rtl ? "rtl" : "ltr",
            }}
          >
            {errorBanner ? (
              <Box
                sx={{
                  mb: 1.5,
                  px: 1.25,
                  py: 1,
                  borderRadius: "10px",
                  bgcolor: "#FEE2E2",
                  border: "1px solid #FECACA",
                }}
              >
                <Typography variant="caption" sx={{ color: "#B91C1C" }}>
                  {errorBanner}
                </Typography>
              </Box>
            ) : null}

            {showWelcome && messages.length === 0 ? (
              <>
                <AssistantMessageBubble
                  role="assistant"
                  content={getWelcomeMessage(language)}
                  rtl={rtl}
                />
                <AssistantQuickReplies
                  suggestions={STATIC_SUGGESTIONS[language]}
                  onSelect={(text) => void sendMessage(text)}
                  disabled={loading}
                  rtl={rtl}
                />
              </>
            ) : null}

            {messages.map((message) => (
              <Box key={message.id}>
                <AssistantMessageBubble role={message.role} content={message.content} rtl={rtl} />
                {message.role === "assistant" && message.screenshots?.length ? (
                  <Box sx={{ pl: rtl ? 0 : 4.5, pr: rtl ? 4.5 : 0, mb: 1 }}>
                    {message.screenshots.map((shot) => (
                      <AssistantScreenshotCard key={shot.url} screenshot={shot} rtl={rtl} />
                    ))}
                  </Box>
                ) : null}
              </Box>
            ))}

            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 4.5, py: 1 }}>
                <CircularProgress size={16} sx={{ color: ASSISTANT_COLORS.primary }} />
                <Typography variant="caption" color={ASSISTANT_COLORS.muted}>
                  ...
                </Typography>
              </Box>
            ) : null}

            {!showWelcome && lastSuggestedActions.length > 0 ? (
              <AssistantQuickReplies
                suggestions={lastSuggestedActions}
                onSelect={(text) => void sendMessage(text)}
                disabled={loading}
                rtl={rtl}
              />
            ) : null}
          </Box>

          {/* Input */}
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              borderTop: `1px solid ${ASSISTANT_COLORS.border}`,
              bgcolor: ASSISTANT_COLORS.surface,
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder={getInputPlaceholder(language)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              inputProps={{
                dir: rtl ? "rtl" : "ltr",
                style: { textAlign: rtl ? "right" : "left" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  fontSize: 13.5,
                  "& fieldset": { borderColor: ASSISTANT_COLORS.accent },
                  "&:hover fieldset": { borderColor: ASSISTANT_COLORS.primary },
                  "&.Mui-focused fieldset": { borderColor: ASSISTANT_COLORS.primary },
                },
              }}
            />
            <IconButton
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              sx={{
                bgcolor: ASSISTANT_COLORS.primary,
                color: "white",
                width: 40,
                height: 40,
                flexShrink: 0,
                "&:hover": { bgcolor: ASSISTANT_COLORS.primaryDark },
                "&.Mui-disabled": { bgcolor: ASSISTANT_COLORS.border, color: ASSISTANT_COLORS.muted },
              }}
            >
              <Send size={18} />
            </IconButton>
          </Box>
        </Box>
      ) : null}

      {/* FAB */}
      <Box
        component="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        sx={{
          position: "fixed",
          bottom: 18,
          right: 18,
          width: 60,
          height: 60,
          borderRadius: "50%",
          bgcolor: ASSISTANT_COLORS.primary,
          color: "white",
          border: "none",
          cursor: "pointer",
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 32px rgba(109,40,217,0.38), 0 2px 8px rgba(0,0,0,0.12)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "scale(1.07)",
            boxShadow: "0 12px 40px rgba(109,40,217,0.48), 0 2px 8px rgba(0,0,0,0.12)",
          },
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </Box>
    </>
  );
}
