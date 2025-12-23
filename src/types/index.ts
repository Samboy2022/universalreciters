export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  location: {
    ward: string;
    lga: string;
    state: string;
    country: string;
  };
  wallet: {
    points: number;
    money: number;
  };
  referralCode: string;
  createdAt: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  duration: number;
  arabicText: string;
  unlockFee: number;
  createdBy: string;
  createdAt: Date;
  views: number;
  likes: number;
}

export interface Recitation {
  id: string;
  userId: string;
  videoId: string;
  score: number;
  mistakes: number;
  recordingUrl?: string;
  createdAt: Date;
}

export interface RecitationWord {
  text: string;
  status: "pending" | "correct" | "incorrect";
  attempts: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  recitations: number;
  location: {
    ward: string;
    lga: string;
    state: string;
    country: string;
  };
}

export interface StreamingVideo {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  unlockFee: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: "text" | "image" | "video";
  createdAt: Date;
}

export interface ChatGroup {
  id: string;
  name: string;
  avatar?: string;
  members: string[];
  lastMessage?: ChatMessage;
  createdAt: Date;
}
