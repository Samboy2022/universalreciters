import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Users, 
  Search,
  Loader2,
  Check,
  CheckCheck,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  lastMessage?: string;
  lastMessageTime?: string;
  otherUser?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface Message {
  id: string;
  content: string | null;
  type: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  sender?: {
    name: string;
    avatar_url: string | null;
  };
}

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
}

const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch conversations with last message
  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get user's conversation memberships
      const { data: memberData } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!memberData || memberData.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const conversationIds = memberData.map((m) => m.conversation_id);
      
      // Get conversations
      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (!convData) {
        setIsLoading(false);
        return;
      }

      // Enhance with last message and other user info
      const enhancedConversations = await Promise.all(
        convData.map(async (conv) => {
          // Get last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // For direct messages, get other user
          let otherUser = null;
          if (!conv.is_group) {
            const { data: members } = await supabase
              .from("conversation_members")
              .select("user_id")
              .eq("conversation_id", conv.id)
              .neq("user_id", user.id)
              .limit(1);

            if (members && members.length > 0) {
              const { data: userData } = await supabase
                .from("profiles")
                .select("id, name, avatar_url")
                .eq("id", members[0].user_id)
                .single();

              otherUser = userData;
            }
          }

          return {
            ...conv,
            lastMessage: lastMsg?.content || null,
            lastMessageTime: lastMsg?.created_at || null,
            otherUser,
          };
        })
      );

      setConversations(enhancedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch sender info for each message
      const messagesWithSenders = await Promise.all(
        data.map(async (msg) => {
          const { data: sender } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", msg.sender_id)
            .single();

          return { ...msg, sender };
        })
      );

      setMessages(messagesWithSenders);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user?.id)
        .eq("is_read", false);
    }
  };

  // Fetch all users for new chat
  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .neq("id", user?.id)
      .order("name");

    if (data) {
      setAllUsers(data);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      setIsMobileViewingChat(true);
    }
  }, [selectedConversation]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          // Skip if it's our own message (already added optimistically)
          if (payload.new.sender_id === user?.id) return;

          // Fetch sender info
          const { data: sender } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            sender,
          } as Message;

          setMessages((prev) => [...prev, newMsg]);

          // Mark as read
          await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      type: "text",
      media_url: null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      sender: { name: profile?.name || "You", avatar_url: profile?.avatar_url || null },
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: messageContent,
      type: "text",
    });

    if (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    } else {
      // Update conversation's updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);
    }
    
    setIsSending(false);
  };

  const startNewChat = async (targetUser: UserProfile) => {
    if (!user) return;

    // Check if conversation already exists
    const { data: existingMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (existingMembers) {
      for (const member of existingMembers) {
        const { data: otherMember } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("conversation_id", member.conversation_id)
          .eq("user_id", targetUser.id)
          .single();

        if (otherMember) {
          // Conversation exists, select it
          const { data: conv } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", member.conversation_id)
            .single();

          if (conv && !conv.is_group) {
            setSelectedConversation({
              ...conv,
              otherUser: targetUser,
            });
            setIsNewChatOpen(false);
            return;
          }
        }
      }
    }

    // Create new conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({
        name: null,
        is_group: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (convError || !conv) {
      toast({ title: "Failed to create conversation", variant: "destructive" });
      return;
    }

    // Add members
    const { error: memberError } = await supabase.from("conversation_members").insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: targetUser.id },
    ]);

    if (memberError) {
      toast({ title: "Failed to add members", variant: "destructive" });
      return;
    }

    setIsNewChatOpen(false);
    await fetchConversations();
    setSelectedConversation({
      ...conv,
      otherUser: targetUser,
    });
    setIsMobileViewingChat(true);
  };

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConversationName = (conv: Conversation) => {
    if (conv.is_group) return conv.name || "Group Chat";
    return conv.otherUser?.name || conv.name || "Chat";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.is_group) return conv.avatar_url;
    return conv.otherUser?.avatar_url || null;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Conversations List */}
        <Card className={cn(
          "w-full md:w-80 flex flex-col",
          isMobileViewingChat ? "hidden md:flex" : "flex"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Messages</CardTitle>
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {filteredUsers.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            No users found
                          </p>
                        ) : (
                          filteredUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => startNewChat(u)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Avatar>
                                <AvatarImage src={u.avatar_url || undefined} />
                                <AvatarFallback>{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{u.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a new chat!</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                        selectedConversation?.id === conv.id
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={getConversationAvatar(conv) || undefined} />
                        <AvatarFallback>
                          {conv.is_group ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            getConversationName(conv).charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground truncate">
                            {getConversationName(conv)}
                          </p>
                          {conv.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(conv.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className={cn(
          "flex-1 flex flex-col",
          !isMobileViewingChat ? "hidden md:flex" : "flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => {
                      setIsMobileViewingChat(false);
                      setSelectedConversation(null);
                    }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={getConversationAvatar(selectedConversation) || undefined} />
                    <AvatarFallback>
                      {selectedConversation.is_group ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        getConversationName(selectedConversation).charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {getConversationName(selectedConversation)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.is_group ? "Group" : "Direct Message"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className="flex items-end gap-2 max-w-[70%]">
                              {!isOwn && (
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {msg.sender?.name?.charAt(0).toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-2",
                                  isOwn
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted text-foreground rounded-bl-sm"
                                )}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-medium mb-1 opacity-70">
                                    {msg.sender?.name}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-[10px] opacity-60">
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {isOwn && (
                                    msg.is_read ? (
                                      <CheckCheck className="w-3 h-3 opacity-60" />
                                    ) : (
                                      <Check className="w-3 h-3 opacity-60" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground mb-1">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a chat or start a new one
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Chat;