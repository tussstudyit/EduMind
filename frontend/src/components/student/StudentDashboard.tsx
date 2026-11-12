// ============================================================================
// EDUMIND AI - STUDENT DASHBOARD COMPONENT (ENHANCED LIVE STATE)
// Dashboard học tập thời gian thực kết nối LocalStorage & Đề xuất học tập (Module 11)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { storageService } from "@/services/storageService";
import { Course, Enrollment, Recommendation } from "@/types";
import { Icon } from "@/components/ui/Icons";

interface StudentDashboardProps {
  onNavigate: (viewId: string) => void;
  onOpenCourse?: (courseId: string) => void;
}

export function StudentDashboard({ onNavigate, onOpenCourse }: StudentDashboardProps) {
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const enrs = storageService.getEnrollments(currentUser.id);
    setEnrollments(enrs.filter((e) => e.status === "active"));
    setCourses(storageService.getCourses("student"));
    setRecommendations(storageService.getRecommendations(currentUser.id));
  }, [currentUser.id]);

  const activeEnr = enrollments[0];
  const activeCourse = activeEnr ? courses.find((c) => c.id === activeEnr.courseId) : courses[0];

  const handleDismissRec = (id: string) => {
    storageService.dismissRecommendation(id);
    setRecommendations(storageService.getRecommendations(currentUser.id));
  };

  const handleMarkReadRec = (id: string) => {
    storageService.markRecommendationRead(id);
    setRecommendations(storageService.getRecommendations(currentUser.id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Welcome Row */}
      <section className="welcome-row">
        <div>
          <span className="welcome-kicker">KHÔNG GIAN HỌC TẬP THÔNG MINH</span>
          <h1>
            Chào buổi sáng, {currentUser.name} <span aria-hidden="true">☀️</span>
          </h1>
          <p>Mỗi bước nhỏ hôm nay sẽ đưa bạn đến gần mục tiêu làm chủ công nghệ hơn.</p>
        </div>
        <button
          onClick={() => onNavigate("student_courses")}
          className="quick-action"
          style={{ cursor: "pointer" }}
        >
          <span>+</span> Khám phá khóa học
        </button>
      </section>

      {/* Module 11: Đề xuất học tập thông minh (AI Recommendations Widget) */}
      {recommendations.length > 0 && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "linear-gradient(90deg, #eff6ff, #f5f3ff)",
            border: "1.5px solid #dbeafe",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#4f46e5",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="sparkles" size={16} />
              </div>
              <div>
                <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#4f46e5", letterSpacing: "0.5px" }}>
                  GỢI Ý HỌC TẬP TỪ AI (ADAPTIVE LEARNING)
                </span>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#1e293b" }}>
                  {recommendations[0].title}
                </strong>
              </div>
            </div>

            <button
              onClick={() => onNavigate("student_recommendations")}
              style={{
                background: "none",
                border: "none",
                color: "#4f46e5",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Xem tất cả ({recommendations.length}) →
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
            {recommendations[0].description}
          </p>

          {/* 3 Explicit Action Buttons: Xem ngay, Đánh dấu đã xem, Bỏ qua */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px" }}>
            <div style={{ fontSize: "10.5px", color: "#6366f1", fontWeight: 700 }}>
              ✦ {recommendations[0].reason || "Dựa trên tiến độ học tập gần đây của bạn"}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => {
                  handleMarkReadRec(recommendations[0].id);
                  if (recommendations[0].type === "quiz") onNavigate("student_quiz");
                  else if (recommendations[0].type === "course") onNavigate("student_courses");
                  else onNavigate("student_learn");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Icon name="play" size={11} /> Xem ngay
              </button>

              {!recommendations[0].isRead && (
                <button
                  onClick={() => handleMarkReadRec(recommendations[0].id)}
                  title="Đánh dấu đã xem gợi ý này"
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <Icon name="check" size={11} /> Đã xem
                </button>
              )}

              <button
                onClick={() => handleDismissRec(recommendations[0].id)}
                title="Bỏ qua gợi ý này"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <section className="stats-grid" aria-label="Tổng quan học tập">
        <article className="stat-card">
          <div className="stat-icon stat-purple"><Icon name="clock" size={19} /></div>
          <div className="stat-content">
            <span className="stat-label">Thời gian học</span>
            <strong className="stat-value">4h 25m</strong>
            <span className="stat-detail">Tuần này (+18%)</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-blue"><Icon name="book" size={19} /></div>
          <div className="stat-content">
            <span className="stat-label">Khóa học đang học</span>
            <strong className="stat-value">0{enrollments.length}</strong>
            <span className="stat-detail">Đang tiến bộ tốt</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-green"><Icon name="check" size={19} /></div>
          <div className="stat-content">
            <span className="stat-label">Bài học hoàn thành</span>
            <strong className="stat-value">12</strong>
            <span className="stat-detail">+3 bài tuần này</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-orange"><Icon name="chart" size={19} /></div>
          <div className="stat-content">
            <span className="stat-label">Điểm trung bình</span>
            <strong className="stat-value">8.6</strong>
            <span className="stat-detail">Tăng 0.4 điểm</span>
          </div>
        </article>
      </section>

      {/* Main Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          {/* Continue Learning Banner */}
          {activeCourse && (
            <section className="continue-card">
              <div className="continue-copy">
                <span className="eyebrow light-eyebrow">
                  <span className="live-dot" /> ĐANG HỌC DỞ
                </span>
                <h2>Tiếp tục hành trình của bạn</h2>
                <p className="continue-course-name">{activeCourse.title}</p>
                <p className="continue-next">
                  Bài tiếp theo: <strong>Bài 4 · Vòng lặp for & hàm range()</strong>
                </p>
                <div className="continue-progress-label">
                  <span>Tiến độ khóa học</span>
                  <strong>{activeEnr ? activeEnr.progressPercent : 68}%</strong>
                </div>
                <div className="progress-track continue-track">
                  <span style={{ width: `${activeEnr ? activeEnr.progressPercent : 68}%` }} />
                </div>
                <button
                  className="continue-button"
                  style={{ border: "none", cursor: "pointer" }}
                  onClick={() => onNavigate("student_learn")}
                >
                  <span className="play-icon"><Icon name="play" size={14} /></span>
                  Tiếp tục học ngay
                  <Icon name="arrow" size={17} />
                </button>
              </div>
              <div className="continue-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="art-card art-card-code">
                  <span className="code-dot code-pink" />
                  <span className="code-dot code-yellow" />
                  <span className="code-dot code-green" />
                  <div className="code-line code-line-long" />
                  <div className="code-line code-line-short" />
                  <div className="code-line code-line-medium" />
                  <div className="code-line code-line-long pale" />
                </div>
                <div className="art-card art-card-python"><span>Py</span></div>
                <div className="art-spark art-spark-one">✦</div>
                <div className="art-spark art-spark-two">✧</div>
              </div>
            </section>
          )}

          {/* Enrolled Courses Grid */}
          <section className="courses-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">KHÓA HỌC ĐÃ GHI DANH</span>
                <h2>Khóa học của bạn ({enrollments.length})</h2>
              </div>
              <button
                onClick={() => onNavigate("student_courses")}
                className="text-link"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Tất cả khóa học <Icon name="arrow" size={15} />
              </button>
            </div>

            <div className="course-grid">
              {enrollments.map((enr) => {
                const c = courses.find((item) => item.id === enr.courseId);
                if (!c) return null;
                return (
                  <article
                    key={enr.id}
                    className="course-card"
                    onClick={() => onNavigate("student_learn")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={`course-visual ${c.tone}`}>
                      <span className="course-subject">{c.subjectName}</span>
                      <span className="course-mark" aria-hidden="true">{c.badgeMark}</span>
                      <div className="course-visual-orb" />
                    </div>
                    <div className="course-card-body">
                      <div className="course-teacher">{c.teacherName}</div>
                      <h3>{c.title}</h3>
                      <div className="course-next">
                        <Icon name="play" size={13} /> {c.lessonCount} bài học
                      </div>
                      <div className="course-progress-row">
                        <div className="progress-track">
                          <span style={{ width: `${enr.progressPercent}%` }} />
                        </div>
                        <strong>{enr.progressPercent}%</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Weekly Activity */}
          <section className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">THÓI QUEN HỌC TẬP</span>
                <h2>Hoạt động tuần này</h2>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>7 ngày gần nhất</span>
            </div>
            <div className="activity-summary">
              <strong>4 giờ 25 phút</strong>
              <span className="activity-change"><span>↗</span> +18%</span>
              <span className="activity-caption">so với tuần trước</span>
            </div>
            <div className="chart">
              {[
                { day: "T2", val: 45 },
                { day: "T3", val: 72 },
                { day: "T4", val: 54 },
                { day: "T5", val: 88, active: true },
                { day: "T6", val: 63 },
                { day: "T7", val: 34 },
                { day: "CN", val: 18 },
              ].map((item) => (
                <div className="chart-column" key={item.day}>
                  <div className="chart-bar-wrap">
                    <span
                      className={`chart-bar${item.active ? " chart-bar-active" : ""}`}
                      style={{ height: `${item.val}%` }}
                    />
                  </div>
                  <span className={item.active ? "chart-day chart-day-active" : "chart-day"}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar panels */}
        <aside className="dashboard-secondary">
          {/* Today Schedule */}
          <section className="panel schedule-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">KẾ HOẠCH CỦA BẠN</span>
                <h2>Lịch học hôm nay</h2>
              </div>
              <button
                onClick={() => onNavigate("student_learn")}
                className="text-link"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Vào học <Icon name="arrow" size={14} />
              </button>
            </div>
            <div className="schedule-item">
              <div className="schedule-time"><strong>09:30</strong><span>30 phút</span></div>
              <div className="schedule-line"><span /></div>
              <div className="schedule-event">
                <span className="schedule-tag tag-python">PYTHON</span>
                <strong>Ôn tập vòng lặp</strong>
                <span><Icon name="clock" size={13} /> 09:30 – 10:00</span>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time"><strong>15:00</strong><span>45 phút</span></div>
              <div className="schedule-line schedule-line-last"><span /></div>
              <div className="schedule-event">
                <span className="schedule-tag tag-math">TOÁN HỌC</span>
                <strong>Luyện tập ma trận</strong>
                <span><Icon name="clock" size={13} /> 15:00 – 15:45</span>
              </div>
            </div>
            <div className="schedule-footer">
              <Icon name="check" size={15} /> Bạn đã hoàn thành 1 phiên học hôm nay
            </div>
          </section>

          {/* Goal Panel */}
          <section className="panel goal-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">MỤC TIÊU TUẦN</span>
                <h2>Bạn đang đi đúng hướng</h2>
              </div>
              <div className="goal-badge">✦</div>
            </div>
            <div className="goal-progress-row">
              <strong>4 <span>/ 5 giờ</span></strong>
              <span>80%</span>
            </div>
            <div className="progress-track goal-track"><span style={{ width: "80%" }} /></div>
            <p className="goal-note">Thêm 1 giờ học nữa để hoàn thành mục tiêu tuần này.</p>
          </section>

          {/* AI Tutor Card */}
          <section className="tutor-card">
            <div className="tutor-decoration tutor-decoration-one" />
            <div className="tutor-decoration tutor-decoration-two" />
            <div className="tutor-card-top">
              <div className="tutor-icon"><Icon name="sparkles" size={21} /></div>
              <span className="tutor-status"><span /> ĐANG SẴN SÀNG</span>
            </div>
            <div className="tutor-copy">
              <span className="eyebrow light-eyebrow">TRỢ LÝ HỌC TẬP AI</span>
              <h2>Có điều gì bạn đang thắc mắc?</h2>
              <p>Hỏi EduMind AI để được giải thích bài học theo cách dễ hiểu nhất.</p>
            </div>
            <button
              onClick={() => onNavigate("student_tutor")}
              className="tutor-button"
              style={{ width: "100%", border: "none", cursor: "pointer" }}
            >
              Bắt đầu trò chuyện <Icon name="arrow" size={16} />
            </button>
            <div className="tutor-suggestions">
              <span>Gợi ý:</span>
              <button
                onClick={() => onNavigate("student_tutor")}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", color: "#fff", fontSize: "10px", padding: "2px 8px", cursor: "pointer" }}
              >
                Giải thích vòng lặp for
              </button>
              <button
                onClick={() => onNavigate("student_ocr")}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", color: "#fff", fontSize: "10px", padding: "2px 8px", cursor: "pointer" }}
              >
                Quét bài tập OCR
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
