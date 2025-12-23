import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_at: string;
  lastMessage?: string;
  unread?: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;

    const { data: memberData } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (memberData && memberData.length > 0) {
      const conversationIds = memberData.map((m) => m.conversation_id);
      
      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convData) {
        setConversations(convData);
      }
    }
    setIsLoading(false);
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        sender:sender_id (
          name,
          avatar_url
        )
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as unknown as Message[]);
    }
  };

  // Fetch all users for new chat
  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .neq("id", user?.id);

    if (data) {
      setAllUsers(data);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Real-time subscription
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setIsSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: newMessage.trim(),
      type: "text",
    });

    if (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage("");
    }
    setIsSending(false);
  };

  const startNewChat = async (targetUser: UserProfile) => {
    if (!user) return;

    // Create conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({
        name: targetUser.name,
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
    await supabase.from("conversation_members").insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: targetUser.id },
    ]);

    setIsNewChatOpen(false);
    fetchConversations();
    setSelectedConversation(conv);
  };

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Conversations List */}
        <Card className="w-80 flex flex-col">
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
                        {filteredUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => startNewChat(u)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Avatar>
                              <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
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
                        <AvatarFallback>
                          {conv.is_group ? <Users className="w-4 h-4" /> : conv.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {conv.name || "Chat"}
                        </p>
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
        <Card className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConversation.is_group ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        selectedConversation.name?.charAt(0) || "?"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedConversation.name || "Chat"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.is_group ? "Group" : "Direct Message"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-22rem)] p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2",
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
                            <p className="text-sm">{msg.content}</p>
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
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button type="button" size="icon" variant="ghost">
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
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
