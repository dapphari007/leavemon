import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AuthUser, UpdateProfileData, User, LoginCredentials } from "../types";
import {
  getProfile,
  login,
  LoginResponse,
  updateProfile,
} from "../services/authService";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: AuthUser | null;
  userProfile: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  subscriptionExpiryDate: Date | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => void;
  updateUserProfile: (data: UpdateProfileData) => Promise<User>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState<Date | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          // Check if token is expired
          const decodedToken: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp < currentTime) {
            // Token is expired
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setUserProfile(null);
          } else {
            // Token is valid
            const parsedUser = JSON.parse(storedUser);
            
            // Ensure all necessary fields are included
            const userWithAllFields = {
              ...parsedUser,
              managerId: parsedUser.managerId || null,
              hrId: parsedUser.hrId || null,
              teamLeadId: parsedUser.teamLeadId || null,
              department: parsedUser.department || null,
              position: parsedUser.position || null,
            };
            
            setUser(userWithAllFields);

            // Fetch full user profile
            try {
              const response = await getProfile();
              if (response.user) {
                // Make sure the profile includes all the necessary fields
                const fullProfile = {
                  ...response.user,
                  managerId: response.user.managerId || userWithAllFields.managerId,
                  hrId: response.user.hrId || userWithAllFields.hrId,
                  teamLeadId: response.user.teamLeadId || userWithAllFields.teamLeadId,
                  department: response.user.department || userWithAllFields.department,
                  position: response.user.position || userWithAllFields.position,
                };
                
                setUserProfile(fullProfile);
                
                // Update the user with any additional fields from the profile
                const updatedUser = {
                  ...userWithAllFields,
                  managerId: fullProfile.managerId,
                  hrId: fullProfile.hrId,
                  teamLeadId: fullProfile.teamLeadId,
                  department: fullProfile.department,
                  position: fullProfile.position,
                };
                
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
              }
            } catch (error) {
              console.error("Failed to fetch user profile:", error);
            }
          }
        } catch (error) {
          // Invalid token
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setUserProfile(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = async (
    credentials: LoginCredentials
  ): Promise<LoginResponse> => {
    const response = await login(credentials);

    // Ensure all necessary fields are included in the user object
    const userWithAllFields = {
      ...response.user,
      managerId: response.user.managerId || null,
      hrId: response.user.hrId || null,
      teamLeadId: response.user.teamLeadId || null,
      department: response.user.department || null,
      position: response.user.position || null,
    };

    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(userWithAllFields));
    
    // Set registration time for new users (for 24-hour access)
    if (!localStorage.getItem("registrationTime")) {
      localStorage.setItem("registrationTime", new Date().toISOString());
    }

    setUser(userWithAllFields);

    // Fetch full user profile
    try {
      const profileResponse = await getProfile();
      if (profileResponse.user) {
        // Make sure the profile includes all the necessary fields
        const fullProfile = {
          ...profileResponse.user,
          managerId: profileResponse.user.managerId || userWithAllFields.managerId,
          hrId: profileResponse.user.hrId || userWithAllFields.hrId,
          teamLeadId: profileResponse.user.teamLeadId || userWithAllFields.teamLeadId,
          department: profileResponse.user.department || userWithAllFields.department,
          position: profileResponse.user.position || userWithAllFields.position,
        };
        
        setUserProfile(fullProfile);
        
        // Update the user with any additional fields from the profile
        const updatedUser = {
          ...userWithAllFields,
          managerId: fullProfile.managerId,
          hrId: fullProfile.hrId,
          teamLeadId: fullProfile.teamLeadId,
          department: fullProfile.department,
          position: fullProfile.position,
        };
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }

    return response;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setUserProfile(null);
  };

  const handleUpdateProfile = async (
    data: UpdateProfileData
  ): Promise<User> => {
    const response = await updateProfile(data);

    if (response.user) {
      // Make sure the profile includes all the necessary fields
      const fullProfile = {
        ...response.user,
        managerId: response.user.managerId || null,
        hrId: response.user.hrId || null,
        teamLeadId: response.user.teamLeadId || null,
        department: response.user.department || null,
        position: response.user.position || null,
      };
      
      setUserProfile(fullProfile);

      // Update the user info in localStorage
      if (user) {
        const updatedUser: AuthUser = {
          ...user,
          firstName: fullProfile.firstName,
          lastName: fullProfile.lastName,
          managerId: fullProfile.managerId,
          hrId: fullProfile.hrId,
          teamLeadId: fullProfile.teamLeadId,
          department: fullProfile.department,
          position: fullProfile.position,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      return fullProfile;
    }

    throw new Error("Failed to update profile");
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const response = await getProfile();
      if (response.user) {
        // Make sure the profile includes all the necessary fields
        const fullProfile = {
          ...response.user,
          managerId: response.user.managerId || null,
          hrId: response.user.hrId || null,
          teamLeadId: response.user.teamLeadId || null,
          department: response.user.department || null,
          position: response.user.position || null,
        };
        
        setUserProfile(fullProfile);
        
        // Update the user with any additional fields from the profile
        if (user) {
          const updatedUser = {
            ...user,
            managerId: fullProfile.managerId,
            hrId: fullProfile.hrId,
            teamLeadId: fullProfile.teamLeadId,
            department: fullProfile.department,
            position: fullProfile.position,
          };
          
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  // Check if user has an active subscription
  const checkSubscription = (): boolean => {
    // If no user is logged in, return false
    if (!user) return false;

    // Check if subscription expiry date is stored in localStorage
    const storedExpiryDate = localStorage.getItem("subscriptionExpiryDate");
    
    if (storedExpiryDate) {
      const expiryDate = new Date(storedExpiryDate);
      const now = new Date();
      
      // Update state
      setSubscriptionExpiryDate(expiryDate);
      const isActive = expiryDate > now;
      setHasActiveSubscription(isActive);
      
      return isActive;
    } else {
      // For new users, set a 24-hour trial period from registration/login time
      const registrationTime = localStorage.getItem("registrationTime");
      
      if (registrationTime) {
        const regTime = new Date(registrationTime);
        const expiryDate = new Date(regTime);
        expiryDate.setHours(expiryDate.getHours() + 24); // 24-hour access
        
        const now = new Date();
        
        // Update state
        setSubscriptionExpiryDate(expiryDate);
        const isActive = expiryDate > now;
        setHasActiveSubscription(isActive);
        
        return isActive;
      }
      
      return false;
    }
  };

  // Check subscription status on component mount and when user changes
  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const value = {
    user,
    userProfile,
    isAuthenticated: !!user,
    isLoading,
    hasActiveSubscription,
    subscriptionExpiryDate,
    login: handleLogin,
    logout: handleLogout,
    updateUserProfile: handleUpdateProfile,
    refreshProfile,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
