import { createContext, useContext, useState, ReactNode } from "react";

interface User {
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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  ward: string;
  lga: string;
  state: string;
  country: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login - will be replaced with actual auth
    setUser({
      id: "1",
      name: "Demo User",
      email,
      role: "user",
      location: {
        ward: "Ward 1",
        lga: "Sample LGA",
        state: "Lagos",
        country: "Nigeria",
      },
      wallet: {
        points: 150,
        money: 5000,
      },
      referralCode: "DEMO123",
    });
  };

  const register = async (data: RegisterData) => {
    // Mock registration - will be replaced with actual auth
    setUser({
      id: "1",
      name: data.name,
      email: data.email,
      role: "user",
      location: {
        ward: data.ward,
        lga: data.lga,
        state: data.state,
        country: data.country,
      },
      wallet: {
        points: 0,
        money: 0,
      },
      referralCode: `REF${Math.random().toString(36).substring(7).toUpperCase()}`,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
