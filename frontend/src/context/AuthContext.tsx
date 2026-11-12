// ============================================================================
// EDUMIND AI - AUTH & RBAC CONTEXT
// Quản lý thông tin phiên làm việc, chuyển đổi vai trò (Dev Role Switcher)
// ============================================================================

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { storageService } from "@/services/storageService";

interface AuthContextType {
  currentUser: User;
  role: UserRole;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    // Default fallback ban đầu
    return {
      id: "student-01",
      email: "minhanh.tran@student.edumind.edu.vn",
      name: "Trần Minh Anh",
      avatar: "MA",
      role: "student",
      status: "active",
      phone: "0934567890",
      department: "Sinh viên K24 - CNTT",
      bio: "Đam mê lập trình Python, Trí tuệ nhân tạo và phát triển ứng dụng thông minh.",
      createdAt: "2026-09-10T07:30:00Z",
      updatedAt: "2026-11-12T08:00:00Z",
    };
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const users = storageService.getUsers();
    const savedUserId = localStorage.getItem(CURRENT_USER_KEY);
    const found = users.find((u) => u.id === savedUserId);
    if (found) {
      setCurrentUser(found);
    } else {
      // Mặc định ban đầu là Student Minh Anh để trải nghiệm ngay
      const defaultStudent = users.find((u) => u.id === "student-01") || users[0];
      if (defaultStudent) setCurrentUser(defaultStudent);
    }
  }, []);

  const switchRole = (newRole: UserRole) => {
    const users = storageService.getUsers();
    let target = users.find((u) => u.role === newRole && u.status === "active");

    if (!target) {
      if (newRole === "admin") target = users.find((u) => u.id === "admin-01");
      else if (newRole === "teacher") target = users.find((u) => u.id === "teacher-01");
      else target = users.find((u) => u.id === "student-01");
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
    const updated = storageService.saveUser({
      ...currentUser,
      ...data,
      id: currentUser.id,
      email: currentUser.email,
      name: data.name || currentUser.name,
      role: currentUser.role,
    });
    setCurrentUser(updated);
  };

  const refreshUsers = () => {
    const users = storageService.getUsers();
    const updated = users.find((u) => u.id === currentUser.id);
    if (updated) setCurrentUser(updated);
  };

  // Hàm kiểm tra quyền hạn (RBAC)
  const can = (permission: Permission): boolean => {
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
        switchRole,
        switchUser,
        updateCurrentUserProfile,
        can,
        refreshUsers,
      }}
    >
      {children}
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
