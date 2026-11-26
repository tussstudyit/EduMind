// ============================================================================
// EDUMIND AI - ADMIN COURSE LIST & VIOLATION MODERATION (MODULE 3 + n8n)
// Admin giám sát toàn bộ khóa học, xử lý báo cáo vi phạm từ Sinh viên qua n8n,
// Tạm khóa (Hidden) hoặc Khóa vĩnh viễn (Archived) khóa học vi phạm
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { Course, CourseReport, CourseStatus, Material } from "@/types";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { CourseVideoPlayer } from "@/components/ui/CourseVideoPlayer";
import { parseVideoSource } from "@/services/courseFileUploadService";

export function AdminCourseList() {
  const { success, info, error } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [reports, setReports] = useState<CourseReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLevel, setEditLevel] = useState<Course["level"]>("beginner");
  const [editDuration, setEditDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [adminNoteByReport, setAdminNoteByReport] = useState<Record<string, string>>({});

  const loadCoursesAndReports = async () => {
    setIsLoading(true);
    try {
      const [courseList, reportList] = await Promise.all([
        apiClient.getCourses(),
        apiClient.getCourseReports().catch(() => []),
      ]);
      setCourses(courseList);
      setReports(reportList);
    } catch (err) {
      error("Không tải được danh sách khóa học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCoursesAndReports();
  }, []);

  const handleChangeStatus = async (course: Course, newStatus: CourseStatus) => {
    try {
      await apiClient.updateCourse(course.id, { status: newStatus });
      const label =
        newStatus === "hidden"
          ? "TẠM KHÓA (HIDDEN)"
          : newStatus === "archived"
          ? "KHÓA (LOCKED / ARCHIVED)"
          : newStatus === "published"
          ? "MỞ KHÓA / XUẤT BẢN"
          : "BẢN NHÁP";
      success("Đã cập nhật trạng thái khóa học", `Khóa học '${course.title}' đã chuyển sang: ${label}`);
      await loadCoursesAndReports();
    } catch (err) {
      error("Không cập nhật được trạng thái", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleModerateReport = async (
    report: CourseReport,
    action: "temporarily_locked" | "permanently_locked" | "unlock" | "dismissed",
  ) => {
    try {
      const customNote = adminNoteByReport[report.id]?.trim();
      await apiClient.moderateCourseReport(report.id, {
        action,
        adminActionNote: customNote,
      });
      const actionLabel =
        action === "temporarily_locked"
          ? "⏸️ Đã TẠM KHÓA khóa học & gửi thông báo qua n8n"
          : action === "permanently_locked"
          ? "🔒 Đã KHÓA khóa học & gửi thông báo qua n8n"
          : action === "unlock"
          ? "🔓 Đã MỞ KHÓA lại khóa học qua n8n"
          : "✅ Đã đóng báo cáo vi phạm";
      success(actionLabel, `Đã đồng bộ trạng thái khóa học "${report.courseTitle}" tới Giảng viên và Sinh viên.`);
      await loadCoursesAndReports();
    } catch (err) {
      error("Không xử lý được báo cáo", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDescription(course.description || "");
    setEditLevel(course.level);
    setEditDuration(course.durationHours);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingCourse || !editTitle.trim()) return;
    setIsSaving(true);
    try {
      const updated = await apiClient.updateCourse(editingCourse.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        level: editLevel,
        durationHours: Number(editDuration),
      });
      success("Đã cập nhật khóa học", `Thông tin '${updated.title}' đã được đồng bộ.`);
      setEditingCourse(null);
      await loadCoursesAndReports();
    } catch (err) {
      error("Không cập nhật được khóa học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewMaterials = async (course: Course) => {
    setViewingCourse(course);
    setCourseMaterials([]);
    setPreviewMaterial(null);
    setIsLoadingMaterials(true);
    try {
      const materials = await apiClient.getMaterials(course.id);
      setCourseMaterials(materials);
      setPreviewMaterial(
        materials.find((material) => material.fileType === "video" || Boolean(parseVideoSource(material.fileUrl)?.isIframe)) ||
          materials[0] ||
          null,
      );
    } catch (err) {
      error("Không tải được tài liệu khóa học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khóa học '${course.title}' khỏi hệ thống?`)) return;
    try {
      await apiClient.deleteCourse(course.id);
      info("Đã xóa khóa học", `Khóa học '${course.title}' đã được xóa.`);
      await loadCoursesAndReports();
    } catch (err) {
      error("Không xóa được khóa học", err instanceof Error ? err.message : "Vui lòng thử lại.");
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

  const pendingReportsCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 3: QUẢN LÝ KHÓA HỌC &amp; KIỂM DUYỆT VI PHẠM QUA N8N (ADMIN)</span>
          <h2>Giám sát Khóa học, Xử lý Báo cáo Vi phạm &amp; Khóa/Tạm khóa</h2>
        </div>
      </div>

      {/* n8n Violation Reports Panel (SV -> n8n -> Admin) */}
      <div
        className="panel"
        style={{
          border: pendingReportsCount > 0 ? "1.5px solid #f59e0b" : "1px solid #e2e8f0",
          background: pendingReportsCount > 0 ? "#fffbeb" : "#ffffff",
        }}
      >
        <div className="panel-heading" style={{ marginBottom: "12px" }}>
          <div>
            <span className="eyebrow" style={{ color: "#b45309" }}>
              LUỒNG TỰ ĐỘNG HÓA N8N (SV ↔ ADMIN): /WEBHOOK/EDUMIND-COURSE-REPORT
            </span>
            <h2 style={{ fontSize: "15px", color: "#1e293b" }}>
              🚨 Báo cáo vi phạm khóa học từ Sinh viên ({reports.length} báo cáo · {pendingReportsCount} chờ xử lý)
            </h2>
          </div>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              background: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#92400e",
              fontSize: "10.5px",
              fontWeight: 800,
            }}
          >
            ⚡ Kết nối n8n Active
          </span>
        </div>

        {reports.length === 0 ? (
          <div style={{ padding: "18px", textAlign: "center", color: "#64748b", fontSize: "12px", background: "#f8fafc", borderRadius: 8 }}>
            Hiện chưa có báo cáo vi phạm nào từ sinh viên. Khi sinh viên bấm &quot;🚨 Báo cáo vi phạm&quot; trên bất kỳ khóa học nào, luồng <strong>n8n</strong> sẽ tự động đẩy báo cáo về đây để Admin <strong>Tạm khóa</strong> hoặc <strong>Khóa</strong> khóa học.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {reports.map((rep) => (
              <div
                key={rep.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "#ffffff",
                  border: rep.status === "pending" ? "1.5px solid #fbbf24" : "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: 800,
                        background:
                          rep.status === "pending"
                            ? "#fef3c7"
                            : rep.status === "temporarily_locked"
                            ? "#ffedd5"
                            : rep.status === "permanently_locked"
                            ? "#fee2e2"
                            : "#ecfdf5",
                        color:
                          rep.status === "pending"
                            ? "#b45309"
                            : rep.status === "temporarily_locked"
                            ? "#c2410c"
                            : rep.status === "permanently_locked"
                            ? "#dc2626"
                            : "#047857",
                      }}
                    >
                      {rep.status === "pending"
                        ? "⏳ CHỜ ADMIN XỬ LÝ"
                        : rep.status === "temporarily_locked"
                        ? "⏸️ ĐÃ TẠM KHÓA KHÓA HỌC"
                        : rep.status === "permanently_locked"
                        ? "🔒 ĐÃ KHÓA VĨNH VIỄN"
                        : "✅ ĐÃ XỬ LÝ / MỞ KHÓA"}
                    </span>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>Khóa học: {rep.courseTitle}</strong>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>(GV: {rep.teacherName})</span>
                  </div>
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                    SV báo cáo: <strong>{rep.reporterName}</strong> ({rep.reporterEmail}) ·{" "}
                    {new Date(rep.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "#334155", background: "#f8fafc", padding: "8px 10px", borderRadius: 6 }}>
                  <strong>Lý do báo cáo:</strong> <span style={{ color: "#dc2626", fontWeight: 700 }}>{rep.reason}</span>
                  {rep.details && <div style={{ marginTop: 3, color: "#475569" }}>Chi tiết: {rep.details}</div>}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Ghi chú quyết định của Admin gửi qua n8n cho SV & GV..."
                    value={adminNoteByReport[rep.id] ?? rep.adminActionNote ?? ""}
                    onChange={(e) => setAdminNoteByReport((prev) => ({ ...prev, [rep.id]: e.target.value }))}
                    style={{
                      flex: 1,
                      minWidth: "240px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "11.5px",
                    }}
                  />
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => void handleModerateReport(rep, "temporarily_locked")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #f59e0b",
                        background: "#fffbeb",
                        color: "#b45309",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      ⏸️ Tạm khóa khóa học
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleModerateReport(rep, "permanently_locked")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#dc2626",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      🔒 Khóa khóa học
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleModerateReport(rep, "unlock")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #10b981",
                        background: "#ecfdf5",
                        color: "#047857",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      🔓 Mở khóa lại
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleModerateReport(rep, "dismissed")}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#475569",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
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

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Tất cả" },
            { id: "published", label: "Đang hoạt động (Published)" },
            { id: "hidden", label: "⏸️ Tạm khóa (Hidden)" },
            { id: "archived", label: "🔒 Đã khóa (Locked)" },
            { id: "draft", label: "Bản nháp" },
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
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Giảng viên &amp; Đánh giá</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Quy mô</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Trạng thái / Kiểm duyệt</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Thao tác Khóa / Mở</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Đang tải danh sách khóa học...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Chưa có khóa học nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filtered.map((course) => (
                <tr key={course.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>
                        {course.subjectName}
                      </span>
                      <strong style={{ display: "block", color: "#1e293b", fontSize: "13px" }}>
                        {course.title}
                      </strong>
                      {(course.pendingReportCount ?? 0) > 0 && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#fee2e2",
                            color: "#dc2626",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          🚨 {course.pendingReportCount} báo cáo vi phạm
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{course.teacherName}</div>
                    <div style={{ fontSize: "11px", color: "#d97706", fontWeight: 700 }}>
                      ⭐ {course.averageRating ?? 5.0}/5.0 ({course.reviewCount ?? 0} đánh giá)
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>
                    {course.lessonCount} buổi · {course.enrolledCount} SV
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      value={course.status}
                      onChange={(e) => void handleChangeStatus(course, e.target.value as CourseStatus)}
                      style={{
                        padding: "5px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        border: "1px solid #cbd5e1",
                        background:
                          course.status === "published"
                            ? "#ecfdf5"
                            : course.status === "hidden"
                            ? "#fffbeb"
                            : course.status === "archived"
                            ? "#fee2e2"
                            : "#f1f5f9",
                        color:
                          course.status === "published"
                            ? "#065f46"
                            : course.status === "hidden"
                            ? "#b45309"
                            : course.status === "archived"
                            ? "#dc2626"
                            : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      <option value="published">Đang hoạt động (Published)</option>
                      <option value="hidden">⏸️ Tạm khóa (Hidden)</option>
                      <option value="archived">🔒 Khóa vĩnh viễn (Locked)</option>
                      <option value="draft">Bản nháp (Draft)</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {course.status !== "hidden" && (
                        <button
                          onClick={() => void handleChangeStatus(course, "hidden")}
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #fcd34d",
                            background: "#fffbeb",
                            color: "#b45309",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Tạm khóa khóa học này"
                        >
                          ⏸️ Tạm khóa
                        </button>
                      )}
                      {course.status !== "archived" && (
                        <button
                          onClick={() => void handleChangeStatus(course, "archived")}
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #fca5a5",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Khóa khóa học này"
                        >
                          🔒 Khóa
                        </button>
                      )}
                      {course.status !== "published" && (
                        <button
                          onClick={() => void handleChangeStatus(course, "published")}
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #6ee7b7",
                            background: "#ecfdf5",
                            color: "#047857",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Mở khóa / Xuất bản khóa học"
                        >
                          🔓 Mở khóa
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(course)}
                        style={{
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: "1px solid #c7d2fe",
                          background: "#eef2ff",
                          color: "#4338ca",
                          cursor: "pointer",
                        }}
                        title="Sửa khóa học"
                      >
                        <Icon name="edit" size={13} />
                      </button>
                      <button
                        onClick={() => void handleViewMaterials(course)}
                        style={{
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: "1px solid #bae6fd",
                          background: "#f0f9ff",
                          color: "#0369a1",
                          cursor: "pointer",
                        }}
                        title="Xem video và tài liệu"
                      >
                        <Icon name="eye" size={13} />
                      </button>
                      <button
                        onClick={() => void handleDelete(course)}
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(editingCourse)}
        onClose={() => setEditingCourse(null)}
        title="Chỉnh sửa khóa học"
        subtitle="Thông tin sau khi lưu sẽ được chia sẻ với giảng viên và học viên."
      >
        <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", fontWeight: 650, color: "#475569" }}>
            Tên khóa học
            <input required maxLength={200} minLength={2} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} style={{ padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: "7px", fontSize: "13px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", fontWeight: 650, color: "#475569" }}>
            Mô tả khóa học
            <textarea rows={4} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} style={{ padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: "7px", fontSize: "13px", resize: "vertical" }} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", fontWeight: 650, color: "#475569" }}>
              Cấp độ
              <select value={editLevel} onChange={(event) => setEditLevel(event.target.value as Course["level"])} style={{ padding: "9px", border: "1px solid #cbd5e1", borderRadius: "7px", background: "#fff" }}>
                <option value="beginner">Cơ bản</option>
                <option value="intermediate">Trung cấp</option>
                <option value="advanced">Nâng cao</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", fontWeight: 650, color: "#475569" }}>
              Thời lượng (giờ)
              <input type="number" min={0} step={1} value={editDuration} onChange={(event) => setEditDuration(Number(event.target.value))} style={{ padding: "9px", border: "1px solid #cbd5e1", borderRadius: "7px" }} />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            <button type="button" onClick={() => setEditingCourse(null)} style={{ padding: "8px 13px", border: "1px solid #cbd5e1", borderRadius: "7px", background: "#fff", cursor: "pointer" }}>Hủy</button>
            <button type="submit" disabled={isSaving} style={{ padding: "8px 14px", border: 0, borderRadius: "7px", background: isSaving ? "#a5b4fc" : "#4f46e5", color: "#fff", fontWeight: 700, cursor: isSaving ? "wait" : "pointer" }}>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewingCourse)}
        onClose={() => { setViewingCourse(null); setPreviewMaterial(null); }}
        title={viewingCourse ? `Kiểm tra Video & Tài liệu · ${viewingCourse.title}` : "Video và tài liệu khóa học"}
        subtitle="Quản trị viên có thể phát trực tiếp cả video MP4 trên server và link Google Drive / YouTube để kiểm duyệt nội dung."
        maxWidth="900px"
      >
        {isLoadingMaterials ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Đang tải danh sách tệp...</div>
        ) : courseMaterials.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Khóa học này chưa có video hoặc tài liệu.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 0.7fr) minmax(0, 1.6fr)", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {courseMaterials.map((material) => (
                <button
                  key={material.id}
                  type="button"
                  onClick={() => setPreviewMaterial(material)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: previewMaterial?.id === material.id ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                    background: previewMaterial?.id === material.id ? "#eef2ff" : "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ display: "block", color: "#1e293b", fontSize: "12px" }}>{material.title}</strong>
                  <span style={{ color: "#64748b", fontSize: "10px" }}>{material.fileType.toUpperCase()} · {material.fileSize}</span>
                </button>
              ))}
            </div>
            <div>
              {previewMaterial ? (
                <CourseVideoPlayer
                  items={[
                    {
                      id: previewMaterial.id,
                      title: previewMaterial.title,
                      url: previewMaterial.fileUrl,
                      fileSize: previewMaterial.fileSize,
                      description: previewMaterial.description,
                    },
                  ]}
                  isTeacherPreview
                />
              ) : (
                <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>Chọn một tệp để xem trước.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
