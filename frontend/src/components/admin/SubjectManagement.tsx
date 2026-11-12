// ============================================================================
// EDUMIND AI - SUBJECT & TOPIC MANAGEMENT COMPONENT (MODULE 2 - ADMIN ONLY)
// Quản lý danh sách/chi tiết Môn học & Quản lý toàn bộ Chủ đề con (Topics)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { Subject, Topic } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

export function SubjectManagement() {
  const { success, error, info } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Modal Subject states
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("book");
  const [formHidden, setFormHidden] = useState(false);

  // Modal Topic states
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicOrder, setTopicOrder] = useState(1);
  const [topicHidden, setTopicHidden] = useState(false);

  const loadData = () => {
    const subs = storageService.getSubjects(true);
    setSubjects(subs);
    if (subs.length > 0 && !selectedSubject) {
      setSelectedSubject(subs[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      const tList = storageService.getTopics(selectedSubject.id, true);
      setTopics(tList);
    }
  }, [selectedSubject]);

  // --- SUBJECT ACTIONS ---
  const handleOpenCreateSubject = () => {
    setEditingSubject(null);
    setFormCode("");
    setFormName("");
    setFormDesc("");
    setFormIcon("book");
    setFormHidden(false);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setFormCode(sub.code);
    setFormName(sub.name);
    setFormDesc(sub.description);
    setFormIcon(sub.iconName);
    setFormHidden(sub.isHidden);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      error("Thiếu thông tin", "Mã môn học và tên môn học không được để trống.");
      return;
    }

    const saved = storageService.saveSubject({
      id: editingSubject ? editingSubject.id : undefined,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formDesc.trim(),
      iconName: formIcon,
      isHidden: formHidden,
    });

    success(
      editingSubject ? "Cập nhật môn học thành công" : "Tạo môn học mới thành công",
      `Môn học [${saved.code}] - ${saved.name} đã được lưu.`
    );

    setIsSubjectModalOpen(false);
    loadData();
    setSelectedSubject(saved);
  };

  const handleToggleHideSubject = (sub: Subject) => {
    const updated = storageService.toggleHideSubject(sub.id);
    if (updated) {
      if (updated.isHidden) {
        info("Đã ẩn môn học", `Môn học ${sub.name} đã được ẩn khỏi học sinh.`);
      } else {
        success("Đã hiện môn học", `Môn học ${sub.name} hiện đã hiển thị.`);
      }
      loadData();
      if (selectedSubject?.id === sub.id) {
        setSelectedSubject(updated);
      }
    }
  };

  const handleDeleteSubject = (sub: Subject) => {
    if (confirm(`Bạn có chắc chắn muốn xóa môn học [${sub.code}] ${sub.name}?`)) {
      storageService.deleteSubject(sub.id);
      success("Đã xóa môn học", `Môn học ${sub.name} đã được gỡ khỏi hệ thống.`);
      const subs = storageService.getSubjects(true);
      setSubjects(subs);
      setSelectedSubject(subs[0] || null);
    }
  };

  // --- TOPIC ACTIONS ---
  const handleOpenCreateTopic = () => {
    setEditingTopic(null);
    setTopicName("");
    setTopicDesc("");
    setTopicOrder(topics.length + 1);
    setTopicHidden(false);
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (t: Topic) => {
    setEditingTopic(t);
    setTopicName(t.name);
    setTopicDesc(t.description);
    setTopicOrder(t.order);
    setTopicHidden(t.isHidden);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !topicName.trim()) return;

    storageService.saveTopic({
      id: editingTopic ? editingTopic.id : undefined,
      subjectId: selectedSubject.id,
      name: topicName.trim(),
      description: topicDesc.trim(),
      order: Number(topicOrder),
      isHidden: topicHidden,
    });

    success(editingTopic ? "Cập nhật chủ đề thành công" : "Đã thêm chủ đề con mới");
    setIsTopicModalOpen(false);
    setTopics(storageService.getTopics(selectedSubject.id, true));
    loadData();
  };

  const handleToggleHideTopic = (t: Topic) => {
    const updated = storageService.toggleHideTopic(t.id);
    if (updated) {
      info(updated.isHidden ? "Đã ẩn chủ đề con" : "Đã hiện chủ đề con");
      if (selectedSubject) {
        setTopics(storageService.getTopics(selectedSubject.id, true));
      }
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    if (!selectedSubject) return;
    if (confirm("Bạn có chắc chắn muốn xóa chủ đề con này?")) {
      storageService.deleteTopic(topicId);
      success("Đã xóa chủ đề con");
      setTopics(storageService.getTopics(selectedSubject.id, true));
      loadData();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 2: MÔN HỌC & CHỦ ĐỀ CON (CHỈ ADMIN THẤY)</span>
          <h2>Quản lý Danh mục Môn học & Khung chương trình</h2>
        </div>
        <button
          onClick={handleOpenCreateSubject}
          className="quick-action"
          style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
        >
          <span>+</span> Thêm môn học mới
        </button>
      </div>

      {/* Main split: Subject List on left, Topic Sub-Tree on right */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Subjects List */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <strong style={{ fontSize: "13px", color: "#1e293b" }}>
            Danh sách Môn học ({subjects.length})
          </strong>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {subjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                    background: isSelected ? "#f5f3ff" : sub.isHidden ? "#f8fafc" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                    opacity: sub.isHidden ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: isSelected ? "#4f46e5" : "#e2e8f0",
                          color: isSelected ? "#ffffff" : "#475569",
                          fontSize: "9px",
                          fontWeight: 800,
                        }}
                      >
                        {sub.code}
                      </span>
                      {sub.isHidden && (
                        <span
                          style={{
                            padding: "2px 5px",
                            borderRadius: "4px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            fontSize: "8.5px",
                            fontWeight: 700,
                          }}
                        >
                          ĐÃ ẨN
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "3px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHideSubject(sub);
                        }}
                        title={sub.isHidden ? "Hiện môn học" : "Ẩn môn học"}
                        style={{
                          padding: "4px",
                          borderRadius: "4px",
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          color: sub.isHidden ? "#d97706" : "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name={sub.isHidden ? "eyeOff" : "eye"} size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditSubject(sub);
                        }}
                        title="Sửa môn học"
                        style={{
                          padding: "4px",
                          borderRadius: "4px",
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          color: "#4f46e5",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name="edit" size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(sub);
                        }}
                        title="Xóa môn học"
                        style={{
                          padding: "4px",
                          borderRadius: "4px",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>

                  <strong style={{ fontSize: "12.5px", color: "#1e293b", margin: "2px 0" }}>
                    {sub.name}
                  </strong>
                  <div style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                    {sub.topicCount} Chủ đề con · {sub.courseCount} Khóa học
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Subject & Child Topics */}
        {selectedSubject ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Subject Banner Overview */}
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#6366f1" }}>
                    {selectedSubject.code}
                  </span>
                  {selectedSubject.isHidden && (
                    <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#fee2e2", color: "#dc2626", fontSize: "9px", fontWeight: 700 }}>
                      ẨN KHỎI HỌC SINH
                    </span>
                  )}
                </div>
                <h2 style={{ margin: "4px 0", fontSize: "17px", color: "#1e293b" }}>{selectedSubject.name}</h2>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{selectedSubject.description}</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleToggleHideSubject(selectedSubject)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: selectedSubject.isHidden ? "#ecfdf5" : "#fffbeb",
                    color: selectedSubject.isHidden ? "#065f46" : "#b45309",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {selectedSubject.isHidden ? "Gạt hiển thị" : "Gạt ẩn môn"}
                </button>
              </div>
            </div>

            {/* Child Topics Section */}
            <div className="panel">
              <div className="panel-heading" style={{ marginBottom: "14px" }}>
                <div>
                  <span className="eyebrow">DANH SÁCH CHỦ ĐỀ CON ({topics.length})</span>
                  <h2>Chủ đề giảng dạy & Kiến thức nền tảng</h2>
                </div>
                <button
                  onClick={handleOpenCreateTopic}
                  className="quick-action"
                  style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
                >
                  <span>+</span> Thêm chủ đề con
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {topics.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                    Chưa có chủ đề con nào. Hãy bấm "+ Thêm chủ đề con" để thiết lập khung kiến thức.
                  </div>
                ) : (
                  topics.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "8px",
                        background: t.isHidden ? "#f8fafc" : "#ffffff",
                        border: t.isHidden ? "1px dashed #cbd5e1" : "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        opacity: t.isHidden ? 0.7 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            fontSize: "11px",
                            fontWeight: 800,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {t.order}
                        </span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>{t.name}</strong>
                            {t.isHidden && (
                              <span style={{ fontSize: "9px", color: "#dc2626", fontWeight: 700 }}>[ĐÃ ẨN]</span>
                            )}
                          </div>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                            {t.description || "Không có mô tả."}
                          </p>
                        </div>
                      </div>

                      {/* Topic Actions */}
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => handleToggleHideTopic(t)}
                          title={t.isHidden ? "Hiện chủ đề" : "Ẩn chủ đề"}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: t.isHidden ? "#d97706" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          <Icon name={t.isHidden ? "eyeOff" : "eye"} size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenEditTopic(t)}
                          title="Sửa chủ đề"
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#4f46e5",
                            cursor: "pointer",
                          }}
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(t.id)}
                          title="Xóa chủ đề"
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #fee2e2",
                            background: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal Add / Edit Subject */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? "Sửa Thông Tin Môn Học" : "Thêm Môn Học Mới"}
        subtitle="Môn học là cấp độ cao nhất dùng để định tuyến và nhóm các khóa học."
      >
        <form onSubmit={handleSaveSubject} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Mã môn học *
              </label>
              <input
                type="text"
                required
                placeholder="Vd: CS101"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Tên môn học *
              </label>
              <input
                type="text"
                required
                placeholder="Vd: Lập trình máy tính & Thuật toán"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              placeholder="Giới thiệu định hướng môn học..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="chk-sub-hidden"
              checked={formHidden}
              onChange={(e) => setFormHidden(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="chk-sub-hidden" style={{ fontSize: "12px", color: "#475569", cursor: "pointer" }}>
              Ẩn môn học này tạm thời (Học viên sẽ không thấy trên danh mục)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              {editingSubject ? "Lưu thay đổi" : "Tạo môn học"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add / Edit Topic */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title={editingTopic ? "Sửa Chủ Đề Con" : "Thêm Chủ Đề Con Mới"}
        subtitle={`Thuộc môn học: [${selectedSubject?.code}] ${selectedSubject?.name}`}
      >
        <form onSubmit={handleSaveTopic} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tên chủ đề con *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Vòng lặp & Cấu trúc lặp"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thứ tự (Order)
              </label>
              <input
                type="number"
                value={topicOrder}
                onChange={(e) => setTopicOrder(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Tóm tắt chủ đề
              </label>
              <input
                type="text"
                placeholder="Vd: For, While, lặp lồng nhau..."
                value={topicDesc}
                onChange={(e) => setTopicDesc(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="chk-top-hidden"
              checked={topicHidden}
              onChange={(e) => setTopicHidden(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="chk-top-hidden" style={{ fontSize: "12px", color: "#475569", cursor: "pointer" }}>
              Ẩn chủ đề con này
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setIsTopicModalOpen(false)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              {editingTopic ? "Cập nhật" : "Tạo chủ đề"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
