// ============================================================================
// EDUMIND AI - TEACHER STUDENT PROGRESS & N8N EMAIL REMINDER VIEW (MODULE 5 & 8)
// Theo dõi tiến độ học viên tham gia số buổi học qua truy cập buổi xem video
// và dùng n8n (/webhook/edumind-progress-reminder) nhắc nhở qua mail bằng mail GV
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Enrollment, Course } from "@/types";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/Modal";

export function StudentProgressView() {
  const { currentUser } = useAuth();
  const { success, warning, info } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isBulkSending, setIsBulkSending] = useState(false);

  // Modal gửi nhắc nhở tùy chỉnh qua n8n
  const [reminderTarget, setReminderTarget] = useState<Enrollment | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    Promise.all([
      apiClient.getCourses().catch(() => []),
      apiClient.getEnrollments().catch(() => []),
    ])
      .then(([myCourses, myEnrollments]) => {
        if (!mounted) return;
        setCourses(myCourses);
        setEnrollments(myEnrollments);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [currentUser.id]);

  const filteredEnrollments = enrollments.filter((e) => {
    if (selectedCourseId === "all") return true;
    return e.courseId === selectedCourseId;
  });

  const getCourseTotalLessons = (courseId: string) => {
    const found = courses.find((c) => c.id === courseId);
    return Math.max(found?.lessonCount || 1, 1);
  };

  const getAttendedCount = (enr: Enrollment, totalLessons: number) => {
    if (Array.isArray(enr.completedLessonIds) && enr.completedLessonIds.length > 0) {
      return enr.completedLessonIds.length;
    }
    return Math.round(((enr.progressPercent || 0) / 100) * totalLessons);
  };

  const handleOpenReminderModal = (enr: Enrollment) => {
    const totalLessons = getCourseTotalLessons(enr.courseId);
    const attended = getAttendedCount(enr, totalLessons);
    setReminderTarget(enr);
    setCustomMessage(
      `Chào ${enr.studentName}, thầy/cô (${currentUser.name} - ${currentUser.email}) nhận thấy em mới hoàn thành ${attended}/${totalLessons} buổi học video (${enr.progressPercent}%) của khóa "${enr.courseTitle}". Em hãy sắp xếp thời gian vào xem video bài giảng và hoàn thành bài tập đúng hạn nhé!`,
    );
  };

  const handleSendSingleReminder = async (enr: Enrollment, messageText?: string) => {
    setSendingId(enr.id);
    try {
      const res = await apiClient.sendProgressReminderN8n({
        studentId: enr.studentId,
        courseId: enr.courseId,
        customMessage: messageText || undefined,
      });
      success(
        "Đã gửi Email nhắc nhở qua n8n!",
        `Đã gửi từ mail GV (${res.teacherEmail}) tới ${res.studentEmail} (${res.attendedLessons}/${res.totalLessons} buổi · ${res.percentCompleted}%).`,
      );
      setReminderTarget(null);
    } catch (err) {
      warning("Không gửi được nhắc nhở", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setSendingId(null);
    }
  };

  const handleBulkRemindLowProgress = async () => {
    const targets = filteredEnrollments.filter((e) => (e.progressPercent || 0) < 80);
    if (targets.length === 0) {
      info("Tất cả học viên đều đạt tiến độ tốt (≥ 80%)!");
      return;
    }
    setIsBulkSending(true);
    let sentCount = 0;
    for (const enr of targets) {
      try {
        await apiClient.sendProgressReminderN8n({
          studentId: enr.studentId,
          courseId: enr.courseId,
        });
        sentCount++;
      } catch {
        // continue
      }
    }
    setIsBulkSending(false);
    success(
      `Đã kích hoạt n8n gửi ${sentCount} Email nhắc học!`,
      `Toàn bộ email nhắc nhở đã được gửi bằng danh nghĩa email Giảng viên (${currentUser.email}).`,
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 5 & 8: THEO DÕI SỐ BUỔI XEM VIDEO & NHẮC NHỞ QUA EMAIL GV (N8N)</span>
          <h2>Tiến độ Học viên tham gia Buổi học & Nhắc học tự động n8n</h2>
        </div>
        <button
          type="button"
          disabled={isBulkSending || filteredEnrollments.length === 0}
          onClick={() => void handleBulkRemindLowProgress()}
          style={{
            padding: "9px 15px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #0284c7)",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 700,
            cursor: isBulkSending ? "wait" : "pointer",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
          }}
        >
          {isBulkSending ? "⏳ Đang gửi qua n8n..." : "📨 Gửi nhắc nhở n8n cho SV < 80% tiến độ"}
        </button>
      </div>

      {/* n8n Teacher Email Banner */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)",
          border: "1px solid #c7d2fe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "11.5px",
          color: "#1e3a8a",
        }}
      >
        <div>
          <strong>⚡ Luồng n8n Nhắc nhở Tiến độ Học tập:</strong> Hệ thống tự động thống kê số buổi học viên đã truy cập xem video bài giảng và gửi Email nhắc nhở thông qua{" "}
          <code>/webhook/edumind-progress-reminder</code> với địa chỉ Reply-To là Email của Giảng viên:{" "}
          <strong style={{ color: "#4338ca" }}>{currentUser.email}</strong>.
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "99px",
            background: "#dcfce7",
            color: "#166534",
            fontSize: "10.5px",
            fontWeight: 800,
          }}
        >
          ● n8n Workflow Active
        </span>
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
          flexWrap: "wrap",
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
              {c.title} ({c.lessonCount || 0} buổi)
            </option>
          ))}
        </select>
        <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>
          Tổng số học viên: <strong>{filteredEnrollments.length}</strong> · Email Giảng viên gửi nhắc:{" "}
          <strong>{currentUser.email}</strong>
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
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Số buổi đã xem Video</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Tiến độ hoàn thành</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Truy cập xem lần cuối</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Nhắc nhở qua Mail GV (n8n)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Đang tải danh sách học viên...
                </td>
              </tr>
            ) : filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Chưa có học viên nào ghi danh vào lớp học này.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((enr) => {
                const totalLessons = getCourseTotalLessons(enr.courseId);
                const attendedCount = getAttendedCount(enr, totalLessons);
                return (
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
                          {enr.studentAvatar || "HV"}
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

                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: "99px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: attendedCount >= totalLessons ? "#dcfce7" : "#eef2ff",
                          color: attendedCount >= totalLessons ? "#166534" : "#4338ca",
                        }}
                      >
                        🎬 {attendedCount} / {totalLessons} buổi
                      </span>
                    </td>

                    {/* Progress bar */}
                    <td style={{ padding: "12px 16px", minWidth: "170px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${enr.progressPercent}%`,
                              height: "100%",
                              background: enr.progressPercent >= 80 ? "#06b6d4" : "#4f46e5",
                              borderRadius: "10px",
                            }}
                          />
                        </div>
                        <strong style={{ fontSize: "11px", color: "#4f46e5", width: "32px", textAlign: "right" }}>
                          {enr.progressPercent}%
                        </strong>
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "11px" }}>
                      {new Date(enr.lastAccessedAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          disabled={sendingId === enr.id}
                          onClick={() => void handleSendSingleReminder(enr)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #c7d2fe",
                            background: "#eef2ff",
                            color: "#4338ca",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: sendingId === enr.id ? "wait" : "pointer",
                          }}
                        >
                          {sendingId === enr.id ? "⏳ Đang gửi..." : "📧 Nhắc nhanh (n8n)"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReminderModal(enr)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          ✍️ Soạn lời nhắn
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal soạn lời nhắn nhắc học gửi qua n8n bằng mail GV */}
      <Modal
        isOpen={Boolean(reminderTarget)}
        onClose={() => setReminderTarget(null)}
        title="Gửi Email nhắc nhở tiến độ học tập qua n8n"
        subtitle={
          reminderTarget
            ? `Gửi từ Email Giảng viên (${currentUser.email}) tới học viên ${reminderTarget.studentName} (${reminderTarget.studentEmail})`
            : ""
        }
      >
        {reminderTarget && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "11.5px",
                color: "#334155",
                lineHeight: 1.6,
              }}
            >
              <div>
                <strong>Khóa học:</strong> {reminderTarget.courseTitle}
              </div>
              <div>
                <strong>Số buổi đã truy cập xem video:</strong>{" "}
                {getAttendedCount(reminderTarget, getCourseTotalLessons(reminderTarget.courseId))} /{" "}
                {getCourseTotalLessons(reminderTarget.courseId)} buổi ({reminderTarget.progressPercent}%)
              </div>
              <div>
                <strong>Email Giảng viên gửi (Reply-To):</strong> {currentUser.name} &lt;{currentUser.email}&gt;
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Nội dung lời nhắn của Giảng viên gửi qua n8n *
              </label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  lineHeight: 1.55,
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setReminderTarget(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={sendingId === reminderTarget.id}
                onClick={() => void handleSendSingleReminder(reminderTarget, customMessage)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#4f46e5",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {sendingId === reminderTarget.id ? "⏳ Đang gửi qua n8n..." : "📧 Gửi Email nhắc học qua n8n"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
