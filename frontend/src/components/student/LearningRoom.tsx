// ============================================================================
// EDUMIND AI - LEARNING ROOM COMPONENT (MODULE 4 & 8)
// Phòng học trực tuyến: Trình phát bài giảng, tải tài liệu & tự động ghi nhận tiến độ
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Course, Lesson, Material, StudentProgress } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

interface LearningRoomProps {
  initialCourseId?: string;
  onAskAITutor?: (question: string) => void;
}

export function LearningRoom({ initialCourseId, onAskAITutor }: LearningRoomProps) {
  const { currentUser } = useAuth();
  const { success, info } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [progress, setProgress] = useState<StudentProgress | undefined>(undefined);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [slidePage, setSlidePage] = useState(1);

  useEffect(() => {
    const list = storageService.getCourses("student");
    setCourses(list);

    let targetCourse = list.find((c) => c.id === initialCourseId);
    if (!targetCourse && list.length > 0) {
      targetCourse = list[0];
    }

    if (targetCourse) {
      setSelectedCourse(targetCourse);
    }
  }, [initialCourseId]);

  useEffect(() => {
    if (selectedCourse) {
      const lesList = storageService.getLessons(selectedCourse.id);
      setLessons(lesList);

      const p = storageService.getProgress(currentUser.id, selectedCourse.id);
      setProgress(p);

      // Chọn bài học đang học dở hoặc bài đầu tiên
      const lastId = p?.lastLessonId;
      const found = lesList.find((l) => l.id === lastId);
      setActiveLesson(found || lesList[0] || null);

      setMaterials(storageService.getMaterials(selectedCourse.id));
    }
  }, [selectedCourse, currentUser.id]);

  const handleSelectLesson = (les: Lesson) => {
    setActiveLesson(les);
    // Cập nhật vị trí học gần nhất
    if (selectedCourse) {
      storageService.markLessonCompleted(currentUser.id, selectedCourse.id, les.id);
      const updatedP = storageService.getProgress(currentUser.id, selectedCourse.id);
      setProgress(updatedP);
    }
  };

  const handleMarkDone = (lessonId: string) => {
    if (!selectedCourse) return;
    const updated = storageService.markLessonCompleted(currentUser.id, selectedCourse.id, lessonId);
    setProgress(updated);
    success("Đã hoàn thành bài học!", `Tiến độ khóa học của bạn đã đạt ${updated.percentCompleted}%.`);
  };

  const handleDownloadMaterial = (m: Material) => {
    info("Đang tải tài liệu...", `Tệp '${m.title}' (${m.fileSize}) bắt đầu tải về máy.`);
  };

  if (!selectedCourse) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Chưa có khóa học nào.</div>;
  }

  const isCompleted = (lessonId: string) => {
    return progress?.completedLessonIds.includes(lessonId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Course Banner & Switcher */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "12px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#ede9fe",
              color: "#6366f1",
              display: "grid",
              placeItems: "center",
              fontSize: "16px",
              fontWeight: 800,
            }}
          >
            {selectedCourse.badgeMark}
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#6366f1", letterSpacing: "0.5px" }}>
              {selectedCourse.subjectName} · {selectedCourse.teacherName}
            </div>
            <h2 style={{ margin: "2px 0 0", fontSize: "16px", color: "#1e293b" }}>{selectedCourse.title}</h2>
          </div>
        </div>

        {/* Progress Display */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#64748b" }}>Tiến độ hoàn thành</div>
            <strong style={{ fontSize: "15px", color: "#4f46e5" }}>
              {progress ? progress.percentCompleted : 0}%
            </strong>
          </div>
          <div style={{ width: "120px", height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progress ? progress.percentCompleted : 0}%`,
                height: "100%",
                background: "#4f46e5",
                borderRadius: "10px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Learning Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Syllabus List */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "13px", color: "#1e293b" }}>Giáo trình bài học ({lessons.length})</strong>
            <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>
              {progress?.completedLessonIds.length || 0}/{lessons.length} đã xong
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {lessons.map((les, idx) => {
              const active = activeLesson?.id === les.id;
              const done = isCompleted(les.id);

              return (
                <div
                  key={les.id}
                  onClick={() => handleSelectLesson(les)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: active ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                    background: active ? "#f5f3ff" : "#f8fafc",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: done ? "#10b981" : "#e2e8f0",
                      color: done ? "#fff" : "#64748b",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {done ? "✓" : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "11.5px",
                        fontWeight: active ? 700 : 550,
                        color: active ? "#4338ca" : "#1e293b",
                        truncate: "ellipsis",
                      }}
                    >
                      {les.title}
                    </div>
                    <div style={{ fontSize: "9.5px", color: "#94a3b8" }}>⏱️ {les.durationMinutes} phút</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Downloadable Materials Section */}
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
            <strong style={{ fontSize: "12px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
              Tài liệu đính kèm ({materials.length})
            </strong>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {materials.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div
                    onClick={() => {
                      setPreviewMaterial(m);
                      setSlidePage(1);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, cursor: "pointer", flex: 1 }}
                    title="Bấm để xem trước tài liệu"
                  >
                    <Icon name="fileText" size={14} className="text-indigo-600" />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "11px", color: "#334155", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</span>
                      <span style={{ fontSize: "9px", color: "#94a3b8" }}>{m.fileType.toUpperCase()} · {m.fileSize}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      onClick={() => {
                        setPreviewMaterial(m);
                        setSlidePage(1);
                      }}
                      title="Xem trước tài liệu"
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        padding: "3px 6px",
                        cursor: "pointer",
                        color: "#4f46e5",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "10px",
                        fontWeight: 600,
                      }}
                    >
                      <Icon name="eye" size={12} /> Xem
                    </button>
                    <button
                      onClick={() => handleDownloadMaterial(m)}
                      title="Tải tệp về máy"
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#64748b",
                      }}
                    >
                      <Icon name="download" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Active Lesson Reader & Video */}
        {activeLesson ? (
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Lesson Title & Mark as Done */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#6366f1" }}>
                  BÀI {activeLesson.order} · {activeLesson.durationMinutes} PHÚT
                </span>
                <h1 style={{ margin: "4px 0 0", fontSize: "20px", color: "#1e293b" }}>{activeLesson.title}</h1>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() =>
                    onAskAITutor?.(
                      `Chào AI Tutor, mình đang học bài '${activeLesson.title}'. Hãy giải thích cho mình tóm tắt nội dung chính và cho 1 ví dụ code nhé!`
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    color: "#6366f1",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon name="sparkles" size={14} /> Hỏi AI Tutor bài này
                </button>

                <button
                  onClick={() => handleMarkDone(activeLesson.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: isCompleted(activeLesson.id) ? "#ecfdf5" : "#10b981",
                    border: isCompleted(activeLesson.id) ? "1px solid #a7f3d0" : "none",
                    color: isCompleted(activeLesson.id) ? "#065f46" : "#ffffff",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon name="check" size={14} />
                  {isCompleted(activeLesson.id) ? "Đã hoàn thành" : "Đánh dấu đã học xong"}
                </button>
              </div>
            </div>

            {/* Video Player Placeholder */}
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(4px)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                }}
              >
                <Icon name="play" size={24} />
              </div>
              <span style={{ marginTop: "12px", fontSize: "12px", color: "#c7d2fe" }}>
                Trình phát Video Bài giảng (Hỗ trợ phụ đề AI & Tua tốc độ 1.5x)
              </span>
            </div>

            {/* Lesson Markdown Content */}
            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                lineHeight: "1.6",
                color: "#334155",
              }}
            >
              <div style={{ whiteSpace: "pre-wrap" }}>{activeLesson.contentMarkdown}</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Material Preview Modal */}
      <Modal
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial ? `Xem trước: ${previewMaterial.title}` : "Xem trước tài liệu"}
        subtitle={previewMaterial ? `Định dạng: ${previewMaterial.fileType.toUpperCase()} · Dung lượng: ${previewMaterial.fileSize} · ${previewMaterial.description || "Tài liệu học tập chính thức"}` : ""}
        maxWidth="720px"
      >
        {previewMaterial && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Viewer Content by FileType */}
            {previewMaterial.fileType === "slide" ? (
              <div
                style={{
                  background: "#0f172a",
                  color: "#f8fafc",
                  borderRadius: "10px",
                  padding: "24px",
                  minHeight: "280px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8" }}>EDUMIND PRESENTATION DECK</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Slide {slidePage} / 3</span>
                  </div>

                  {slidePage === 1 && (
                    <div>
                      <h2 style={{ fontSize: "18px", color: "#ffffff", margin: "0 0 10px" }}>{previewMaterial.title}</h2>
                      <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6" }}>
                        Tổng quan kiến thức cốt lõi, sơ đồ luồng dữ liệu và các cấu trúc giải thuật nền tảng.
                      </p>
                      <ul style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.8", marginTop: "12px", paddingLeft: "18px" }}>
                        <li>Định nghĩa và mục đích sử dụng trong thực tế.</li>
                        <li>Độ phức tạp thời gian O(n) và không gian O(1).</li>
                        <li>Các trường hợp biên cần chú ý khi xử lý ngoại lệ.</li>
                      </ul>
                    </div>
                  )}

                  {slidePage === 2 && (
                    <div>
                      <h3 style={{ fontSize: "16px", color: "#38bdf8", margin: "0 0 10px" }}>Mô hình luồng thực thi (Architecture)</h3>
                      <div style={{ background: "#1e293b", padding: "12px 16px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", color: "#a5f3fc" }}>
                        Input Data -&gt; Validator -&gt; Processing Engine -&gt; Formatted Output
                      </div>
                      <p style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "12px", lineHeight: "1.5" }}>
                        Dữ liệu đầu vào được tiền xử lý và lọc nhiễu trước khi đưa vào các thuật toán logic trọng tâm.
                      </p>
                    </div>
                  )}

                  {slidePage === 3 && (
                    <div>
                      <h3 style={{ fontSize: "16px", color: "#4ade80", margin: "0 0 10px" }}>Tổng kết & Bài tập ứng dụng</h3>
                      <p style={{ fontSize: "12.5px", color: "#cbd5e1", lineHeight: "1.5" }}>
                        Ôn tập kỹ các cú pháp cơ bản và thực hành trực tiếp trong mục Bài kiểm tra / AI Tutor.
                      </p>
                      <div style={{ marginTop: "12px", padding: "10px", background: "rgba(74, 222, 128, 0.1)", borderRadius: "6px", border: "1px solid rgba(74, 222, 128, 0.3)", color: "#86efac", fontSize: "11px" }}>
                        ✦ Gợi ý: Hãy hỏi AI Tutor nếu cần giải thích chi tiết từng dòng lệnh!
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #1e293b" }}>
                  <button
                    disabled={slidePage === 1}
                    onClick={() => setSlidePage((p) => Math.max(1, p - 1))}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      background: slidePage === 1 ? "#1e293b" : "#334155",
                      color: slidePage === 1 ? "#64748b" : "#ffffff",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: slidePage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    ← Trang trước
                  </button>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Trang {slidePage} trên 3</span>
                  <button
                    disabled={slidePage === 3}
                    onClick={() => setSlidePage((p) => Math.min(3, p + 1))}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      background: slidePage === 3 ? "#1e293b" : "#4f46e5",
                      color: slidePage === 3 ? "#64748b" : "#ffffff",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: slidePage === 3 ? "not-allowed" : "pointer",
                    }}
                  >
                    Trang tiếp →
                  </button>
                </div>
              </div>
            ) : previewMaterial.fileType === "code" ? (
              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #334155",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ background: "#1e293b", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#eab308", display: "inline-block" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                    <span style={{ fontSize: "11px", color: "#cbd5e1", marginLeft: "10px", fontFamily: "monospace" }}>source_code.py</span>
                  </div>
                  <button
                    onClick={() => info("Đã sao chép mã nguồn vào Clipboard")}
                    style={{ background: "#334155", color: "#e2e8f0", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "10.5px", cursor: "pointer" }}
                  >
                    Sao chép mã
                  </button>
                </div>
                <pre
                  style={{
                    padding: "16px",
                    margin: 0,
                    fontFamily: "Consolas, Menlo, Monaco, monospace",
                    fontSize: "12px",
                    lineHeight: "1.7",
                    color: "#f8fafc",
                    overflowX: "auto",
                  }}
                >
                  <code>{`# ==============================================================================
# EDUMIND AI - SAMPLE CODE DEMO
# ==============================================================================

def execute_algorithm(items: list[int]) -> dict:
    """Xử lý danh sách phần tử và trả về thống kê dữ liệu"""
    total = sum(items)
    average = total / len(items) if items else 0.0
    
    # Lọc các giá trị lớn hơn trung bình
    above_avg = [x for x in items if x > average]
    
    return {
        "count": len(items),
        "total": total,
        "average": round(average, 2),
        "highlighted": above_avg
    }

# Chạy thử nghiệm
sample_data = [12, 45, 68, 23, 89, 34, 91]
result = execute_algorithm(sample_data)
print("Kết quả:", result)`}</code>
                </pre>
              </div>
            ) : (
              /* PDF / Word / ZIP viewer */
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "24px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "16px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#ede9fe", color: "#4f46e5", display: "grid", placeItems: "center" }}>
                    <Icon name="fileText" size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", color: "#1e293b" }}>{previewMaterial.title}</h3>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Tài liệu đọc trực tuyến · Đã sẵn sàng tải về máy</span>
                  </div>
                </div>

                <div style={{ fontSize: "12.5px", color: "#334155", lineHeight: "1.65" }}>
                  <p><strong>Mục tiêu học phần:</strong> Tài liệu này cung cấp toàn bộ định dạng lý thuyết và ví dụ minh họa từng bước để sinh viên theo dõi song song với video giảng dạy.</p>
                  <p><strong>Nội dung tóm lược:</strong></p>
                  <ol style={{ paddingLeft: "20px" }}>
                    <li>Giới thiệu và cài đặt môi trường làm việc.</li>
                    <li>Khái niệm biến, kiểu dữ liệu nguyên thủy và cấu trúc điều khiển.</li>
                    <li>Các lỗi thường gặp và cách gỡ lỗi (debugging) hiệu quả.</li>
                    <li>Bài tập thực hành củng cố kèm lời giải chi tiết.</li>
                  </ol>
                  <p style={{ color: "#64748b", fontSize: "11.5px", fontStyle: "italic", marginTop: "14px" }}>
                    * Sinh viên có thể tải toàn bộ tệp gốc bên dưới để xem offline trên máy tính hoặc in ấn tài liệu.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadMaterial(previewMaterial);
                  setPreviewMaterial(null);
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <Icon name="download" size={14} /> Tải tệp về máy ({previewMaterial.fileSize})
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
