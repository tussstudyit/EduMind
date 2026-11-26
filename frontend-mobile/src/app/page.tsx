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
import { LibraryView } from "@/components/student/LibraryView";
import { LearningRoom } from "@/components/student/LearningRoom";
import { QuizTaking } from "@/components/student/QuizTaking";
import { AITutorView } from "@/components/student/AITutorView";
import { OCRScannerView } from "@/components/student/OCRScannerView";
import { RecommendationView } from "@/components/student/RecommendationView";
import { AIChatWidget } from "@/components/student/AIChatWidget";

export default function Home() {
  const { role } = useAuth();
  const [activeView, setActiveView] = useState<string>("student_courses");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("course-01");
  const [tutorPrompt, setTutorPrompt] = useState<string>("");
  const [tutorCourseId, setTutorCourseId] = useState<string | undefined>(undefined);
  const [tutorConversationId, setTutorConversationId] = useState<string | undefined>(undefined);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Tự động chuyển view tương ứng khi đổi Role (SV vào thẳng trang Tìm kiếm & Gợi ý kiểu Studocu)
  useEffect(() => {
    if (role === "admin") {
      setActiveView("admin_dashboard");
    } else if (role === "teacher") {
      setActiveView("teacher_dashboard");
    } else {
      setActiveView("student_courses");
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
        case "teacher_ocr":
          return (
            <OCRScannerView
              onOpenAITutor={() => {
                setActiveView("teacher_quizzes");
              }}
            />
          );
        default:
          return <TeacherDashboard onNavigate={setActiveView} />;
      }
    }

    // Role: Student (Trang chủ mặc định là Tìm kiếm & Gợi ý kiểu Studocu - CourseCatalog)
    switch (activeView) {
      case "student_courses":
      case "student_dashboard":
        return (
          <CourseCatalog
            onLearnCourse={(cId) => {
              setSelectedCourseId(cId);
              setActiveView("student_learn");
            }}
            onOpenView={(viewId) => setActiveView(viewId)}
            onAskAITutor={(prompt) => {
              setTutorPrompt(prompt);
              setTutorCourseId(undefined);
              setTutorConversationId(undefined);
              setActiveView("student_tutor");
            }}
          />
        );
      case "student_library":
        return <LibraryView onBrowseClasses={() => setActiveView("student_courses")} />;
      case "student_learn":
        return (
          <LearningRoom
            initialCourseId={selectedCourseId}
            onBrowseClasses={() => setActiveView("student_courses")}
            onAskAITutor={(prompt, courseId) => {
              setTutorPrompt(prompt);
              setTutorCourseId(courseId);
              setTutorConversationId(undefined);
              setActiveView("student_tutor");
            }}
          />
        );
      case "student_quiz":
        return <QuizTaking />;
      case "student_tutor":
        return (
          <AITutorView
            initialPrompt={tutorPrompt}
            initialCourseId={tutorCourseId}
            initialConversationId={tutorConversationId}
            onInitialPromptConsumed={() => {
              setTutorPrompt("");
              setTutorCourseId(undefined);
            }}
            onInitialConversationConsumed={() => setTutorConversationId(undefined)}
          />
        );
      case "student_ocr":
        return (
          <OCRScannerView
            onOpenAITutor={(conversationId) => {
              setTutorPrompt("");
              setTutorCourseId(undefined);
              setTutorConversationId(conversationId);
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
          <CourseCatalog
            onLearnCourse={(cId) => {
              setSelectedCourseId(cId);
              setActiveView("student_learn");
            }}
            onOpenView={(viewId) => setActiveView(viewId)}
            onAskAITutor={(prompt) => {
              setTutorPrompt(prompt);
              setTutorCourseId(undefined);
              setTutorConversationId(undefined);
              setActiveView("student_tutor");
            }}
          />
        );
    }
  };

  return (
    <div className="app-shell" id="top">
      {/* Sidebar điều hướng riêng của FE Desktop */}
      <Sidebar
        activeView={activeView}
        onSelectView={(viewId) => {
          setActiveView(viewId);
          setIsMobileDrawerOpen(false);
        }}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Vùng hiển thị nội dung chính */}
      <div className="app-main">
        <Topbar
          onNavigate={(viewId) => {
            setActiveView(viewId);
            setIsMobileDrawerOpen(false);
          }}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />
        <main className="dashboard-content">
          {renderActiveView()}
        </main>
      </div>
      {activeView !== "student_tutor" && <AIChatWidget />}
    </div>
  );
}
