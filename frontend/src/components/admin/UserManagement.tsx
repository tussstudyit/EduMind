// ============================================================================
// EDUMIND AI - USER MANAGEMENT COMPONENT (MODULE 1)
// Admin quản lý danh sách tài khoản, cấp vai trò (RBAC) và khóa/mở tài khoản
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { apiClient, PasswordResetRequest } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";

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
  const [formInstitution, setFormInstitution] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoadingResetRequests, setIsLoadingResetRequests] = useState(true);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      setUsers(await apiClient.getUsers());
    } catch (err) {
      error("Không tải được người dùng", err instanceof Error ? err.message : "Hãy đăng nhập bằng tài khoản Admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadResetRequests();
  }, []);

  const loadResetRequests = async () => {
    setIsLoadingResetRequests(true);
    try {
      setResetRequests(await apiClient.getPasswordResetRequests());
    } catch (err) {
      error("Không tải được yêu cầu khôi phục", err instanceof Error ? err.message : "Vui lòng thử tải lại.");
    } finally {
      setIsLoadingResetRequests(false);
    }
  };

  const handleSendResetLink = async (request: PasswordResetRequest) => {
    setSendingRequestId(request.id);
    try {
      await apiClient.sendPasswordResetLink(request.id);
      success("Đã gửi email khôi phục", `Liên kết đặt lại mật khẩu đã được gửi đến ${request.email}.`);
      await loadResetRequests();
    } catch (err) {
      error("Chưa gửi được email", err instanceof Error ? err.message : "Kiểm tra cấu hình SMTP và workflow n8n.");
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormRole("student");
    setFormPhone("");
    setFormInstitution("");
    setFormPassword("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPhone(user.phone || "");
    setFormInstitution(user.institution || user.department || "");
    setFormPassword("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      error("Thiếu thông tin bắt buộc", "Vui lòng nhập họ tên và email hợp lệ.");
      return;
    }

    if (!editingUser && formPassword.length < 8) {
      error("Mật khẩu chưa hợp lệ", "Mật khẩu tài khoản mới cần ít nhất 8 ký tự.");
      return;
    }

    try {
      if (editingUser) {
        await apiClient.updateUser(editingUser.id, {
          name: formName.trim(), email: formEmail.trim(), role: formRole,
          phone: formPhone.trim(), institution: formInstitution.trim(),
        });
      } else {
        await apiClient.createUser({
          name: formName.trim(), email: formEmail.trim(), role: formRole,
          phone: formPhone.trim(), institution: formInstitution.trim(), password: formPassword,
        });
      }

      success(
        editingUser ? "Đã cập nhật tài khoản" : "Tạo tài khoản thành công!",
        `Người dùng ${formName} (${formRole.toUpperCase()}) đã được lưu vào hệ thống.`
      );
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      error("Không lưu được tài khoản", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleToggleLock = async (user: User) => {
    try {
      const updated = await apiClient.updateUser(user.id, { status: user.status === "active" ? "locked" : "active" });
      if (updated.status === "locked") info("Đã khóa tài khoản", `Tài khoản ${user.name} đã bị khóa quyền truy cập.`);
      else success("Đã mở khóa tài khoản", `Tài khoản ${user.name} đã được khôi phục hoạt động.`);
      await loadUsers();
    } catch (err) {
      error("Không cập nhật được trạng thái", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Xóa vĩnh viễn tài khoản ${user.name} (${user.email})?`)) return;
    try {
      await apiClient.deleteUser(user.id);
      success("Đã xóa tài khoản", `${user.name} đã được xóa khỏi hệ thống.`);
      await loadUsers();
    } catch (err) {
      error("Không xóa được tài khoản", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ([u.institution, u.department].some((value) => value?.toLowerCase().includes(searchQuery.toLowerCase())));
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

      {/* Password recovery requests */}
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div>
            <strong style={{ color: "#1e293b", fontSize: "13px" }}>Yêu cầu khôi phục mật khẩu</strong>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11px" }}>Admin duyệt yêu cầu rồi gửi liên kết đặt lại qua n8n.</p>
          </div>
          <button onClick={loadResetRequests} disabled={isLoadingResetRequests} style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff", color: "#475569", fontSize: "11px", cursor: "pointer" }}>
            Tải lại
          </button>
        </div>
        {isLoadingResetRequests ? (
          <p style={{ color: "#94a3b8", fontSize: "11px", margin: 0 }}>Đang tải yêu cầu...</p>
        ) : resetRequests.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "11px", margin: 0 }}>Hiện chưa có yêu cầu khôi phục mật khẩu.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {resetRequests.map((request) => (
              <div key={request.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", padding: "10px 12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ color: "#1e293b", fontSize: "11px" }}>{request.name}</strong>
                  <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "8px" }}>{request.email}</span>
                  <div style={{ color: "#94a3b8", fontSize: "10px", marginTop: "3px" }}>
                    {new Date(request.requestedAt).toLocaleString("vi-VN")} · {request.status === "pending" ? "Đang chờ" : request.status === "sent" ? "Đã gửi email" : "Đã hoàn tất"}
                  </div>
                </div>
                {request.status !== "completed" && (
                  <button
                    onClick={() => handleSendResetLink(request)}
                    disabled={sendingRequestId !== null}
                    style={{ flexShrink: 0, padding: "7px 10px", border: "none", borderRadius: "6px", background: sendingRequestId === request.id ? "#94a3b8" : "#4f46e5", color: "#fff", fontSize: "10.5px", fontWeight: 650, cursor: sendingRequestId !== null ? "wait" : "pointer" }}
                  >
                    {sendingRequestId === request.id ? "Đang gửi..." : request.status === "sent" ? "Gửi lại qua n8n" : "Gửi link qua n8n"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

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
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Trường</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Trạng thái</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Ngày tạo</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Đang tải danh sách tài khoản...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
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
                    {user.institution || user.department || "Chưa thiết lập"}
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
                      <button
                        onClick={() => handleDelete(user)}
                        title="Xóa tài khoản"
                        style={{
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: "1px solid #fecaca",
                          background: "#fff",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
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

          {!editingUser && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Mật khẩu ban đầu * (tối thiểu 8 ký tự)
              </label>
              <PasswordInput
                required
                minLength={8}
                autoComplete="new-password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Vai trò *
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
                <option value="student">Sinh viên</option>
                <option value="teacher">Giảng viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Số điện thoại
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 0912 345 678"
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
              Trường
            </label>
            <input
              type="text"
              maxLength={160}
              placeholder="Tên trường đang học hoặc công tác"
              value={formInstitution}
              onChange={(e) => setFormInstitution(e.target.value)}
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
