/**
 * Authentication Context
 * Purpose: Manages user authentication state and session data
 * Provides authentication methods and user data to the entire application
 */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { message } from "antd";

// Create the authentication context
const AuthContext = createContext();

// Secret key for encryption - should match the one used in API routes
const SECRET_KEY = "your-secret-key-here";

/**
 * Authentication Provider Component
 * Wraps the entire application to provide authentication context
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);

  /**
   * Initialize authentication state on component mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication from sessionStorage
   */
  const initializeAuth = () => {
    try {
      const storedToken = sessionStorage.getItem("sessionToken");
      const storedUser = sessionStorage.getItem("userData");

      console.log(
        "Initializing auth - storedToken:",
        storedToken ? "exists" : "missing"
      );
      console.log(
        "Initializing auth - storedUser:",
        storedUser ? "exists" : "missing"
      );

      if (storedToken && storedUser) {
        // Validate the stored session
        const isValid = validateStoredSession(storedToken, storedUser);
        console.log("Session validation result:", isValid);

        if (isValid) {
          setSessionToken(storedToken);
          setUser(JSON.parse(storedUser));
          console.log("Session restored successfully");
          console.log("Session token:", storedToken.substring(0, 20) + "...");
          console.log("User:", JSON.parse(storedUser));
        } else {
          // Clear invalid session data
          console.log("Invalid session, clearing...");
          clearSession("invalidSession");
        }
      } else {
        console.log("No stored session found");
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      clearSession("initializeAuthError");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate stored session data
   */
  const validateStoredSession = (token, userData) => {
    try {
      const user = JSON.parse(userData);
      console.log("User data:", user);
      const loginTime = new Date(user.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

      // Check if session is expired (24 hours)
      if (hoursSinceLogin > 24) {
        return false;
      }

      return !!(user.id && user.username && user.role);
    } catch (error) {
      return false;
    }
  };

  /**
   * Login function - handles the login process
   */
  const login = async (email, password) => {
    try {
      setLoading(true);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        message.error(data.message || "Login failed");
        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Network error. Please try again.");
      return {
        success: false,
        message: "Network error",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * OTP validation function
   */
  const validateOTP = async (otpToken, otp) => {
    try {
      setLoading(true);

      const response = await fetch("/api/otp-validation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otpToken, otp }),
      });

      const data = await response.json();

      if (data.success) {
        // Store session data
        const { sessionToken, user: userData } = data.data;

        // Store in sessionStorage
        sessionStorage.setItem("sessionToken", sessionToken);
        sessionStorage.setItem("userData", JSON.stringify(userData));

        // Update state
        setSessionToken(sessionToken);
        setUser(userData);

        message.success("Login successful!");
        return {
          success: true,
          user: userData,
        };
      } else {
        message.error(data.message || "OTP validation failed");
        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      console.error("OTP validation error:", error);
      message.error("Network error. Please try again.");
      return {
        success: false,
        message: "Network error",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      if (sessionToken) {
        // Call logout API
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear session data regardless of API call result
      clearSession("logout");
      message.success("Logged out successfully");
    }
  };

  /**
   * Clear session data
   */
  const clearSession = (reason = "manual_clear") => {
    console.log("Clearing session:", reason);
    sessionStorage.removeItem("sessionToken");
    sessionStorage.removeItem("userData");
    setSessionToken(null);
    setUser(null);
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;

    try {
      const { modules = [], actions = [] } = user.permissions;
      return modules.includes(permission) || actions.includes(permission);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role) => {
    if (!user) return false;
    return user.role.toLowerCase() === role.toLowerCase();
  };

  /**
   * Get authorization header for API calls
   */
  const getAuthHeader = () => {
    if (!sessionToken) return {};
    return {
      Authorization: `Bearer ${sessionToken}`,
      "x-session-token": sessionToken,
    };
  };

  /**
   * Make authenticated API call
   */
  const apiCall = async (url, options = {}) => {
    const authHeaders = getAuthHeader();
    console.log("Making API call to:", url);
    console.log("Auth headers:", authHeaders);
    console.log("Session token exists:", !!sessionToken);
    console.log("User exists:", !!user);

    // Check if we have a session token before making the call
    if (!sessionToken) {
      console.error("No session token available for API call");
      clearSession("no_session_token");
      window.location.href = "/login";
      return null;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log("API response status:", response.status);

    if (response.status === 401) {
      // Unauthorized - clear session and redirect to login
      console.log(
        "401 Unauthorized - clearing session and redirecting to login"
      );
      clearSession("401_response");
      window.location.href = "/login";
      return null;
    }

    return response;
  };

  const value = {
    user,
    loading,
    sessionToken,
    login,
    validateOTP,
    logout,
    hasPermission,
    hasRole,
    getAuthHeader,
    apiCall,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
