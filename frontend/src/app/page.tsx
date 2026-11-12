// ============================================================================
// EDUMIND AI - CENTRAL APPLICATION SHELL & DYNAMIC ROUTER
// Điều hướng giao diện tương thích 3 vai trò (Admin / Teacher / Student)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

// Auth & Profile Views
import { ProfileView } from "@/components/auth/ProfileView";

// Admin Views
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { SubjectManagement } from "@/components/admin/SubjectManagement";
import { AdminCourseList } from "@/components/admin/AdminCourseList";
import { SystemConfigView } from "@/components/admin/SystemConfigView";

// Teacher Views
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";
import { TeacherCourses } from "@/components/teacher/TeacherCourses";
import { QuizManager } from "@/components/teacher/QuizManager";
import { GradingCenter } from "@/components/teacher/GradingCenter";
import { StudentProgressView } from "@/components/teacher/StudentProgressView";

// Student Views
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { CourseCatalog } from "@/components/student/CourseCatalog";
import { LearningRoom } from "@/components/student/LearningRoom";
import { QuizTaking } from "@/components/student/QuizTaking";
import { AITutorView } from "@/components/student/AITutorView";
import { OCRScannerView } from "@/components/student/OCRScannerView";
import { RecommendationView } from "@/components/student/RecommendationView";

export default function Home() {
  const { role } = useAuth();
  const [activeView, setActiveView] = useState<string>("student_dashboard");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("course-01");
  const [tutorPrompt, setTutorPrompt] = useState<string>("");

  // Tự động chuyển view tương ứng khi đổi Role
  useEffect(() => {
    if (role === "admin") {
      setActiveView("admin_dashboard");
    } else if (role === "teacher") {
      setActiveView("teacher_dashboard");
    } else {
      setActiveView("student_dashboard");
    }
  }, [role]);

  // Điều phối hiển thị View theo RBAC & State
  const renderActiveView = () => {
    // Trang Hồ sơ cá nhân (Dùng chung cho cả 3 vai trò)
    if (activeView === "profile") {
      return <ProfileView />;
    }

    if (role === "admin") {
      switch (activeView) {
        case "admin_dashboard":
          return <AdminDashboard onNavigate={setActiveView} />;
        case "admin_users":
          return <UserManagement />;
        case "admin_subjects":
          return <SubjectManagement />;
        case "admin_courses":
          return <AdminCourseList />;
        case "admin_system":
          return <SystemConfigView />;
        default:
          return <AdminDashboard onNavigate={setActiveView} />;
      }
    }

    if (role === "teacher") {
      switch (activeView) {
        case "teacher_dashboard":
          return <TeacherDashboard onNavigate={setActiveView} />;
        case "teacher_courses":
          return <TeacherCourses />;
        case "teacher_quizzes":
          return <QuizManager />;
        case "teacher_grading":
          return <GradingCenter />;
        case "teacher_progress":
          return <StudentProgressView />;
        default:
          return <TeacherDashboard onNavigate={setActiveView} />;
      }
    }

    // Role: Student
    switch (activeView) {
      case "student_dashboard":
        return (
          <StudentDashboard
            onNavigate={setActiveView}
            onOpenCourse={(cId) => {
              setSelectedCourseId(cId);
              setActiveView("student_learn");
            }}
          />
        );
      case "student_courses":
        return (
          <CourseCatalog
            onLearnCourse={(cId) => {
              setSelectedCourseId(cId);
              setActiveView("student_learn");
            }}
          />
        );
      case "student_learn":
        return (
          <LearningRoom
            initialCourseId={selectedCourseId}
            onAskAITutor={(prompt) => {
              setTutorPrompt(prompt);
              setActiveView("student_tutor");
            }}
          />
        );
      case "student_quiz":
        return <QuizTaking />;
      case "student_tutor":
        return <AITutorView initialPrompt={tutorPrompt} />;
      case "student_ocr":
        return (
          <OCRScannerView
            onOpenAITutor={(prompt?: string) => {
              if (prompt) setTutorPrompt(prompt);
              setActiveView("student_tutor");
            }}
          />
        );
      case "student_recommendations":
        return (
          <RecommendationView
            onNavigate={setActiveView}
            onOpenCourse={(cId) => {
              setSelectedCourseId(cId);
              setActiveView("student_learn");
            }}
          />
        );
      default:
        return (
          <StudentDashboard
            onNavigate={setActiveView}
            onOpenCourse={(cId) => {
              setSelectedCourseId(cId);
              setActiveView("student_learn");
            }}
          />
        );
    }
  };

  return (
    <div className="app-shell" id="top">
      {/* Sidebar điều hướng theo vai trò */}
      <Sidebar activeView={activeView} onSelectView={setActiveView} />

      {/* Vùng hiển thị nội dung chính */}
      <div className="app-main">
        <Topbar onNavigate={setActiveView} />
        <main className="dashboard-content">
          {renderActiveView()}
          <footer className="dashboard-footer" style={{ marginTop: "40px" }}>
            <span>© 2026 EduMind AI LMS · Hệ thống Đào tạo & Quản lý Học tập Thông minh</span>
            <span>Chế độ: Frontend Mock Layer (Sẵn sàng tích hợp API)</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
