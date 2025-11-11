import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "admin" | "cutter" | "tailor" | "finisher";

interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Try to fetch user profile using uid as document ID (new method)
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            // Check if user is active
            if (profileData.isActive !== false) {
              setUserProfile(profileData);
            } else {
              console.warn("User account is inactive");
              setUserProfile(null);
            }
          } else {
            // Fallback: Try to find user by uid field (for users created with old method)
            console.log("User document not found by ID, trying to query by uid field...");
            const userQuery = query(
              collection(db, "users"),
              where("uid", "==", firebaseUser.uid)
            );
            const querySnapshot = await getDocs(userQuery);
            
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data() as UserProfile;
              if (userData.isActive !== false) {
                setUserProfile(userData);
                console.log("User profile found using fallback query");
              } else {
                console.warn("User account is inactive");
                setUserProfile(null);
              }
            } else {
              console.error("User profile not found in Firestore for uid:", firebaseUser.uid);
              console.error("Please ensure the user exists in the 'users' collection with the correct uid");
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signOut }}>
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
