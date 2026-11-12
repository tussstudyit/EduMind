// ============================================================================
// EDUMIND AI - ADMIN COURSE LIST COMPONENT (MODULE 3)
// Admin giám sát toàn bộ khóa học, phê duyệt xuất bản hoặc ẩn/xóa khóa học
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { Course, CourseStatus } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";

export function AdminCourseList() {
  const { success, info } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const loadCourses = () => {
    setCourses(storageService.getCourses("admin"));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleChangeStatus = (course: Course, newStatus: CourseStatus) => {
    storageService.saveCourse({
      ...course,
      status: newStatus,
    });
    success("Cập nhật trạng thái", `Khóa học '${course.title}' đã chuyển sang: ${newStatus.toUpperCase()}`);
    loadCourses();
  };

  const handleDelete = (course: Course) => {
    if (confirm(`Bạn có chắc chắn muốn xóa khóa học '${course.title}' khỏi hệ thống?`)) {
      storageService.deleteCourse(course.id);
      info("Đã xóa khóa học", `Khóa học '${course.title}' đã được xóa.`);
      loadCourses();
    }
  };

  const filtered = courses.filter((c) => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 3: GIÁM SÁT KHÓA HỌC TOÀN TRƯỜNG (ADMIN)</span>
          <h2>Danh sách Khóa học & Trạng thái Xuất bản</h2>
        </div>
      </div>

      {/* Filter and Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          padding: "14px 18px",
          borderRadius: "10px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "400px" }}>
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên khóa học, giảng viên, môn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontSize: "12px", background: "transparent" }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "all", label: "Tất cả" },
            { id: "published", label: "Đã xuất bản" },
            { id: "draft", label: "Bản nháp" },
            { id: "archived", label: "Lưu trữ" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                border: statusFilter === tab.id ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                background: statusFilter === tab.id ? "#e0e7ff" : "#f8fafc",
                color: statusFilter === tab.id ? "#3730a3" : "#64748b",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of courses */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Khóa học</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Giảng viên phụ trách</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Bài học</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Học viên</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Trạng thái</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((course) => (
              <tr key={course.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>
                      {course.subjectName}
                    </span>
                    <strong style={{ display: "block", color: "#1e293b", fontSize: "13px" }}>
                      {course.title}
                    </strong>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "#475569" }}>{course.teacherName}</td>
                <td style={{ padding: "12px 16px", color: "#475569" }}>{course.lessonCount} bài</td>
                <td style={{ padding: "12px 16px", color: "#475569" }}>{course.enrolledCount} học viên</td>
                <td style={{ padding: "12px 16px" }}>
                  <select
                    value={course.status}
                    onChange={(e) => handleChangeStatus(course, e.target.value as CourseStatus)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 650,
                      border: "1px solid #cbd5e1",
                      background:
                        course.status === "published"
                          ? "#ecfdf5"
                          : course.status === "draft"
                          ? "#fffbeb"
                          : "#f1f5f9",
                      color:
                        course.status === "published"
                          ? "#065f46"
                          : course.status === "draft"
                          ? "#b45309"
                          : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    <option value="published">Đã xuất bản (Published)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                    <option value="hidden">Ẩn (Hidden)</option>
                  </select>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => handleDelete(course)}
                    style={{
                      padding: "5px 8px",
                      borderRadius: "6px",
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      color: "#dc2626",
                      cursor: "pointer",
                    }}
                    title="Xóa khóa học"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
