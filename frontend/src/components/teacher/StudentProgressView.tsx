// ============================================================================
// EDUMIND AI - TEACHER STUDENT PROGRESS VIEW (MODULE 5 & 8)
// Giảng viên xem danh sách học viên ghi danh & theo dõi tiến độ học tập lớp học
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Enrollment, Course } from "@/types";
import { storageService } from "@/services/storageService";
import { Icon } from "@/components/ui/Icons";

export function StudentProgressView() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    const myCourses = storageService.getCourses("teacher", currentUser.id);
    setCourses(myCourses);
    setEnrollments(storageService.getEnrollments());
  }, [currentUser.id]);

  const filteredEnrollments = enrollments.filter((e) => {
    if (selectedCourseId === "all") return true;
    return e.courseId === selectedCourseId;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 5 & 8: GHI DANH KHÓA HỌC & TIẾN ĐỘ LỚP HỌC</span>
          <h2>Danh sách Học viên & Tiến độ Học tập</h2>
        </div>
      </div>

      {/* Course Filter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
          Lọc theo Lớp / Khóa học:
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "12px",
            background: "#fff",
            maxWidth: "360px",
          }}
        >
          <option value="all">Tất cả các khóa học phụ trách</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "auto" }}>
          Tổng số học viên: <strong>{filteredEnrollments.length}</strong>
        </span>
      </div>

      {/* Roster Table */}
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
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Sinh viên</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Khóa học</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Ngày ghi danh</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Tiến độ hoàn thành</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Truy cập lần cuối</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.map((enr) => (
              <tr key={enr.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#fee2e2",
                        color: "#dc2626",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                    >
                      {enr.studentAvatar}
                    </div>
                    <div>
                      <strong style={{ color: "#1e293b", display: "block" }}>{enr.studentName}</strong>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{enr.studentEmail}</span>
                    </div>
                  </div>
                </td>

                <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 600 }}>
                  {enr.courseTitle}
                </td>

                <td style={{ padding: "12px 16px", color: "#64748b" }}>
                  {new Date(enr.enrolledAt).toLocaleDateString("vi-VN")}
                </td>

                {/* Progress bar */}
                <td style={{ padding: "12px 16px", minWidth: "180px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${enr.progressPercent}%`,
                          height: "100%",
                          background: enr.progressPercent >= 80 ? "#10b981" : "#4f46e5",
                          borderRadius: "10px",
                        }}
                      />
                    </div>
                    <strong style={{ fontSize: "11px", color: "#4f46e5", width: "32px", textAlign: "right" }}>
                      {enr.progressPercent}%
                    </strong>
                  </div>
                </td>

                <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "11px" }}>
                  {new Date(enr.lastAccessedAt).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
