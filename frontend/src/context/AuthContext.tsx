// ============================================================================
// EDUMIND AI - AUTH & RBAC CONTEXT
// Quản lý thông tin phiên làm việc, chuyển đổi vai trò (Dev Role Switcher)
// ============================================================================

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { storageService } from "@/services/storageService";
import { apiClient } from "@/services/apiClient";

interface AuthContextType {
  currentUser: User;
  role: UserRole;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  establishSession: (user: User, accessToken: string) => void;
  signOut: () => void;
  switchRole: (newRole: UserRole) => void;
  switchUser: (userId: string) => void;
  updateCurrentUserProfile: (data: Partial<User>) => void;
  can: (permission: Permission) => boolean;
  refreshUsers: () => void;
}

export type Permission =
  | "manage_users" // Chỉ Admin
  | "manage_subjects" // Chỉ Admin
  | "view_system_logs" // Chỉ Admin
  | "edit_ai_config" // Chỉ Admin
  | "create_course" // Teacher & Admin
  | "edit_course" // Teacher sở hữu hoặc Admin
  | "manage_lessons" // Teacher sở hữu hoặc Admin
  | "create_quiz" // Teacher sở hữu hoặc Admin
  | "grade_submission" // Teacher & Admin
  | "view_correct_answers" // Teacher & Admin (CẤM Student)
  | "enroll_course" // Student
  | "take_quiz" // Student
  | "use_ai_tutor" // Student
  | "use_ocr_scanner"; // Student

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = "edumind_current_user_id";
const isDevelopment = process.env.NODE_ENV === "development";

const anonymousUser: User = {
  id: "guest",
  email: "",
  name: "Chưa đăng nhập",
  avatar: "?",
  role: "student",
  status: "active",
  createdAt: "",
  updatedAt: "",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(() => anonymousUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    storageService.removeDeletedTestAccount();
    if (isDevelopment) {
      const users = storageService.getUsers();
      const found = users.find((u) => u.id === localStorage.getItem(CURRENT_USER_KEY));
      if (found) setCurrentUser(found);
    }
    if (!apiClient.getAccessToken()) {
      setIsAuthLoading(false);
      return;
    }
    apiClient.getMe()
      .then((user) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
      })
      .catch(() => apiClient.clearAccessToken())
      .finally(() => setIsAuthLoading(false));
  }, []);

  const establishSession = (user: User, accessToken: string) => {
    apiClient.setAccessToken(accessToken);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsAuthLoading(false);
    if (typeof window !== "undefined") localStorage.removeItem(CURRENT_USER_KEY);
  };

  const signOut = () => {
    apiClient.clearAccessToken();
    setIsAuthenticated(false);
    setCurrentUser(isDevelopment ? (storageService.getUsers().find((user) => user.id === "student-02") || anonymousUser) : anonymousUser);
  };

  const switchRole = (newRole: UserRole) => {
    if (!isDevelopment) return;
    const users = storageService.getUsers();
    let target = users.find((u) => u.role === newRole && u.status === "active");

    if (!target) {
      if (newRole === "admin") target = users.find((u) => u.id === "admin-01");
      else if (newRole === "teacher") target = users.find((u) => u.id === "teacher-01");
      else target = users.find((u) => u.id === "student-02");
    }

    if (target) {
      setCurrentUser(target);
      if (typeof window !== "undefined") {
        localStorage.setItem(CURRENT_USER_KEY, target.id);
      }
      storageService.addSystemLog(
        "DEV_ROLE_SWITCHED",
        `Chuyển nhanh phiên làm việc sang vai trò [${newRole.toUpperCase()}]: ${target.name}`
      );
    }
  };

  const switchUser = (userId: string) => {
    if (!isDevelopment) return;
    const users = storageService.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      if (typeof window !== "undefined") {
        localStorage.setItem(CURRENT_USER_KEY, target.id);
      }
    }
  };

  const updateCurrentUserProfile = (data: Partial<User>) => {
    if (isAuthenticated) {
      apiClient.updateProfile(data).then(setCurrentUser).catch((err: Error) => console.error(err));
      return;
    }
    if (!isDevelopment) return;
    const updated = storageService.saveUser({ ...currentUser, ...data, id: currentUser.id, email: currentUser.email, name: data.name || currentUser.name, role: currentUser.role });
    setCurrentUser(updated);
  };

  const refreshUsers = () => {
    if (!isDevelopment) return;
    const users = storageService.getUsers();
    const updated = users.find((u) => u.id === currentUser.id);
    if (updated) setCurrentUser(updated);
  };

  // Hàm kiểm tra quyền hạn (RBAC)
  const can = (permission: Permission): boolean => {
    if (!isAuthenticated && !isDevelopment) return false;
    const r = currentUser.role;

    switch (permission) {
      case "manage_users":
      case "manage_subjects":
      case "view_system_logs":
      case "edit_ai_config":
        return r === "admin";

      case "create_course":
      case "manage_lessons":
      case "create_quiz":
      case "grade_submission":
      case "view_correct_answers":
        return r === "teacher" || r === "admin";

      case "edit_course":
        return r === "teacher" || r === "admin";

      case "enroll_course":
      case "take_quiz":
      case "use_ocr_scanner":
        return r === "student";

      case "use_ai_tutor":
        return r === "student" || r === "teacher";

      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        isAuthenticated,
        isAuthLoading,
        establishSession,
        signOut,
        switchRole,
        switchUser,
        updateCurrentUserProfile,
        can,
        refreshUsers,
      }}
    >
      {mounted && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
