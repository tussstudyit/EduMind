// ============================================================================
// EDUMIND AI - USER MANAGEMENT COMPONENT (MODULE 1)
// Admin quản lý danh sách tài khoản, cấp vai trò (RBAC) và khóa/mở tài khoản
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

export function UserManagement() {
  const { success, error, info } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("student");
  const [formPhone, setFormPhone] = useState("");
  const [formDept, setFormDept] = useState("");

  const loadUsers = () => {
    setUsers(storageService.getUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormRole("student");
    setFormPhone("");
    setFormDept("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPhone(user.phone || "");
    setFormDept(user.department || "");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      error("Thiếu thông tin bắt buộc", "Vui lòng nhập họ tên và email hợp lệ.");
      return;
    }

    storageService.saveUser({
      id: editingUser ? editingUser.id : undefined,
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      phone: formPhone.trim(),
      department: formDept.trim(),
    });

    success(
      editingUser ? "Đã cập nhật tài khoản" : "Tạo tài khoản thành công!",
      `Người dùng ${formName} (${formRole.toUpperCase()}) đã được lưu vào hệ thống.`
    );

    setIsModalOpen(false);
    loadUsers();
  };

  const handleToggleLock = (user: User) => {
    const updated = storageService.toggleLockUser(user.id);
    if (updated) {
      if (updated.status === "locked") {
        info("Đã khóa tài khoản", `Tài khoản ${user.name} đã bị khóa quyền truy cập.`);
      } else {
        success("Đã mở khóa tài khoản", `Tài khoản ${user.name} đã được khôi phục hoạt động.`);
      }
      loadUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRole && matchQuery;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 1: QUẢN TRỊ TÀI KHOẢN & PHÂN QUYỀN</span>
          <h2>Danh sách Người dùng & Vai trò</h2>
        </div>
        <button
          onClick={handleOpenCreate}
          className="quick-action"
          style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
        >
          <span>+</span> Thêm tài khoản mới
        </button>
      </div>

      {/* Filter and Search Bar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "420px" }}>
          <Icon name="search" size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, chuyên khoa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "12px",
              background: "transparent",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
            >
              <Icon name="x" size={12} />
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "all", label: "Tất cả" },
            { id: "admin", label: "Quản trị viên" },
            { id: "teacher", label: "Giảng viên" },
            { id: "student", label: "Học viên" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterRole(tab.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                border: filterRole === tab.id ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                background: filterRole === tab.id ? "#e0e7ff" : "#f8fafc",
                color: filterRole === tab.id ? "#3730a3" : "#64748b",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
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
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Người dùng</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Vai trò</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Khoa / Lớp</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Trạng thái</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Ngày tạo</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Không tìm thấy tài khoản người dùng phù hợp.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: user.status === "locked" ? "#fef2f2" : "transparent",
                  }}
                >
                  {/* User info */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "11px",
                          fontWeight: 800,
                          background:
                            user.role === "admin"
                              ? "#fee2e2"
                              : user.role === "teacher"
                              ? "#dbeafe"
                              : "#e0e7ff",
                          color:
                            user.role === "admin"
                              ? "#dc2626"
                              : user.role === "teacher"
                              ? "#2563eb"
                              : "#4f46e5",
                        }}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <strong style={{ color: "#1e293b", display: "block" }}>{user.name}</strong>
                        <span style={{ fontSize: "10.5px", color: "#64748b" }}>{user.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background:
                          user.role === "admin"
                            ? "#fee2e2"
                            : user.role === "teacher"
                            ? "#dbeafe"
                            : "#ecfdf5",
                        color:
                          user.role === "admin"
                            ? "#991b1b"
                            : user.role === "teacher"
                            ? "#1e40af"
                            : "#065f46",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td style={{ padding: "12px 16px", color: "#475569" }}>
                    {user.department || "Chưa thiết lập"}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "12px 16px" }}>
                    {user.status === "active" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          color: "#16a34a",
                          fontWeight: 650,
                          fontSize: "11px",
                        }}
                      >
                        <span
                          style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }}
                        />
                        Hoạt động
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          color: "#dc2626",
                          fontWeight: 650,
                          fontSize: "11px",
                        }}
                      >
                        <span
                          style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626" }}
                        />
                        Bị khóa
                      </span>
                    )}
                  </td>

                  {/* Created At */}
                  <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "11px" }}>
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        onClick={() => handleOpenEdit(user)}
                        title="Chỉnh sửa hồ sơ & vai trò"
                        style={{
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          background: "#ffffff",
                          color: "#4f46e5",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name="edit" size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleLock(user)}
                        title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        style={{
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          background: user.status === "active" ? "#ffffff" : "#fee2e2",
                          color: user.status === "active" ? "#d97706" : "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name={user.status === "active" ? "lock" : "unlock"} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Chỉnh sửa người dùng & Vai trò" : "Thêm tài khoản người dùng mới"}
        subtitle="Quản trị viên có toàn quyền gán vai trò và cập nhật thông tin phòng ban."
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Họ và tên *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Nguyễn Văn A"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Địa chỉ Email *
            </label>
            <input
              type="email"
              required
              placeholder="Vd: van.a@edumind.edu.vn"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Vai trò hệ thống (RBAC) *
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#fff",
                  outline: "none",
                }}
              >
                <option value="student">Học viên (Student)</option>
                <option value="teacher">Giảng viên (Teacher)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Số điện thoại
              </label>
              <input
                type="text"
                placeholder="09..."
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Khoa / Bộ môn / Lớp sinh viên
            </label>
            <input
              type="text"
              placeholder="Vd: Khoa Công nghệ Thông tin"
              value={formDept}
              onChange={(e) => setFormDept(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                background: "#4f46e5",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
