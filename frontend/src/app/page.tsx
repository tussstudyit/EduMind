import type { ReactNode } from "react";

type IconName =
  | "home"
  | "book"
  | "calendar"
  | "chart"
  | "sparkles"
  | "settings"
  | "search"
  | "bell"
  | "arrow"
  | "clock"
  | "play"
  | "check"
  | "chevron";

const iconPaths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
      <path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5M4 19h17" />
      <path d="m7 15 4-4 3 2 5-6" />
      <path d="M16 7h3v3" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8zM5 2l.7 2.3L8 5l-2.3.7L5 8l-.7-2.3L2 5l2.3-.7z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.1.9-1.1 1.9-1.3-.5a7.7 7.7 0 0 1-1.5.9l-.2 1.4h-2.2l-.4-1.3a7.7 7.7 0 0 1-1.7 0l-.4 1.3H9.6l-.2-1.4a7.7 7.7 0 0 1-1.5-.9l-1.3.5-1.1-1.9 1.1-.9a7.7 7.7 0 0 1 0-1.8l-1.1-.9 1.1-1.9 1.3.5a7.7 7.7 0 0 1 1.5-.9l.2-1.4h2.2l.4 1.3a7.7 7.7 0 0 1 1.7 0l.4-1.3h2.2l.2 1.4a7.7 7.7 0 0 1 1.5.9l1.3-.5 1.1 1.9-1.1.9a7.7 7.7 0 0 1 0 1.8Z" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  play: <path d="m9 6 10 6-10 6z" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

const navigation: { label: string; icon: IconName; href: string }[] = [
  { label: "Tổng quan", icon: "home", href: "#top" },
  { label: "Khóa học", icon: "book", href: "#courses" },
  { label: "Lịch học", icon: "calendar", href: "#schedule" },
  { label: "Tiến độ", icon: "chart", href: "#progress" },
  { label: "AI Tutor", icon: "sparkles", href: "#tutor" },
];

const courses = [
  {
    subject: "LẬP TRÌNH",
    title: "Python từ cơ bản đến ứng dụng",
    teacher: "Nguyễn Hoàng Nam",
    lesson: "Bài 8 · Vòng lặp for",
    progress: 68,
    tone: "lavender",
    mark: "Py",
  },
  {
    subject: "TOÁN HỌC",
    title: "Đại số tuyến tính",
    teacher: "Trần Thu Hà",
    lesson: "Bài 5 · Ma trận và định thức",
    progress: 42,
    tone: "mint",
    mark: "∑",
  },
];

const week = [
  { day: "T2", value: 45 },
  { day: "T3", value: 72 },
  { day: "T4", value: 54 },
  { day: "T5", value: 88 },
  { day: "T6", value: 63 },
  { day: "T7", value: 34 },
  { day: "CN", value: 18 },
];

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="EduMind AI trang chủ">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-name">
        EduMind <b>AI</b>
      </span>
    </a>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Điều hướng chính">
      <Brand />
      <div className="sidebar-label">KHÔNG GIAN HỌC TẬP</div>
      <nav className="side-nav">
        {navigation.map((item, index) => (
          <a
            className={`nav-link${index === 0 ? " active" : ""}`}
            href={item.href}
            key={item.label}
            aria-current={index === 0 ? "page" : undefined}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            {item.label === "AI Tutor" && <span className="nav-new">MỚI</span>}
          </a>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="streak-card">
          <div className="streak-icon" aria-hidden="true">✦</div>
          <div>
            <strong>Giữ nhịp học nhé!</strong>
            <p>Học 20 phút mỗi ngày để duy trì chuỗi của bạn.</p>
          </div>
          <div className="streak-days" aria-label="Đã học 4 ngày liên tiếp">
            <span>4</span> ngày
          </div>
        </div>
        <a className="nav-link settings-link" href="#settings">
          <Icon name="settings" size={19} />
          <span>Cài đặt</span>
        </a>
        <div className="profile-row">
          <div className="avatar avatar-student">MA</div>
          <div className="profile-copy">
            <strong>Minh Anh</strong>
            <span>Học viên</span>
          </div>
          <button className="icon-button profile-more" type="button" aria-label="Tùy chọn tài khoản">
            <span className="more-dots">···</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Điều hướng di động">
      {navigation.slice(0, 5).map((item, index) => (
        <a className={index === 0 ? "mobile-nav-item active" : "mobile-nav-item"} href={item.href} key={item.label}>
          <Icon name={item.icon} size={19} />
          <span>{item.label === "Tổng quan" ? "Trang chủ" : item.label}</span>
        </a>
      ))}
    </nav>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div className="mobile-brand-wrap"><Brand /></div>
      <label className="search-box">
        <Icon name="search" size={18} />
        <input type="search" placeholder="Tìm khóa học, bài học..." aria-label="Tìm kiếm" />
        <kbd>⌘ K</kbd>
      </label>
      <div className="topbar-actions">
        <button className="icon-button notification-button" type="button" aria-label="Thông báo">
          <Icon name="bell" size={19} />
          <span className="notification-dot" />
        </button>
        <div className="topbar-divider" />
        <div className="topbar-profile">
          <div className="avatar avatar-student">MA</div>
          <div className="topbar-profile-copy">
            <strong>Minh Anh</strong>
            <span>Học viên</span>
          </div>
          <Icon name="chevron" size={15} />
        </div>
      </div>
    </header>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <span className="stat-detail">{detail}</span>
      </div>
    </article>
  );
}

function ContinueLearning() {
  return (
    <section className="continue-card" aria-labelledby="continue-title">
      <div className="continue-copy">
        <span className="eyebrow light-eyebrow"><span className="live-dot" /> ĐANG HỌC</span>
        <h2 id="continue-title">Tiếp tục hành trình của bạn</h2>
        <p className="continue-course-name">Python từ cơ bản đến ứng dụng</p>
        <p className="continue-next">Bài tiếp theo: <strong>Vòng lặp for</strong></p>
        <div className="continue-progress-label">
          <span>Tiến độ khóa học</span>
          <strong>68%</strong>
        </div>
        <div className="progress-track continue-track"><span style={{ width: "68%" }} /></div>
        <a className="continue-button" href="#courses">
          <span className="play-icon"><Icon name="play" size={14} /></span>
          Tiếp tục học
          <Icon name="arrow" size={17} />
        </a>
      </div>
      <div className="continue-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="art-card art-card-code">
          <span className="code-dot code-pink" /><span className="code-dot code-yellow" /><span className="code-dot code-green" />
          <div className="code-line code-line-long" /><div className="code-line code-line-short" />
          <div className="code-line code-line-medium" /><div className="code-line code-line-long pale" />
          <div className="code-line code-line-short pale" />
        </div>
        <div className="art-card art-card-python"><span>Py</span></div>
        <div className="art-spark art-spark-one">✦</div>
        <div className="art-spark art-spark-two">✧</div>
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: (typeof courses)[number] }) {
  return (
    <article className="course-card">
      <div className={`course-visual ${course.tone}`}>
        <span className="course-subject">{course.subject}</span>
        <span className="course-mark" aria-hidden="true">{course.mark}</span>
        <div className="course-visual-orb" />
      </div>
      <div className="course-card-body">
        <div className="course-teacher">{course.teacher}</div>
        <h3>{course.title}</h3>
        <div className="course-next"><Icon name="play" size={13} /> {course.lesson}</div>
        <div className="course-progress-row">
          <div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div>
          <strong>{course.progress}%</strong>
        </div>
      </div>
    </article>
  );
}

function WeeklyActivity() {
  return (
    <section className="panel activity-panel" id="progress" aria-labelledby="activity-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">THÓI QUEN HỌC TẬP</span>
          <h2 id="activity-title">Hoạt động tuần này</h2>
        </div>
        <button className="select-button" type="button">7 ngày <Icon name="chevron" size={14} /></button>
      </div>
      <div className="activity-summary">
        <strong>4 giờ 25 phút</strong>
        <span className="activity-change"><span>↗</span> +18%</span>
        <span className="activity-caption">so với tuần trước</span>
      </div>
      <div className="chart" role="img" aria-label="Biểu đồ thời gian học trong bảy ngày qua">
        {week.map((item, index) => (
          <div className="chart-column" key={item.day}>
            <div className="chart-bar-wrap">
              <span className={`chart-bar${index === 3 ? " chart-bar-active" : ""}`} style={{ height: `${item.value}%` }} />
            </div>
            <span className={index === 3 ? "chart-day chart-day-active" : "chart-day"}>{item.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SchedulePanel() {
  return (
    <section className="panel schedule-panel" id="schedule" aria-labelledby="schedule-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">KẾ HOẠCH CỦA BẠN</span>
          <h2 id="schedule-title">Lịch học hôm nay</h2>
        </div>
        <a className="text-link" href="#schedule">Xem lịch <Icon name="arrow" size={15} /></a>
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
      <div className="schedule-footer"><Icon name="check" size={15} /> Bạn đã hoàn thành 1 phiên học hôm nay</div>
    </section>
  );
}

function TutorCard() {
  return (
    <section className="tutor-card" id="tutor" aria-labelledby="tutor-title">
      <div className="tutor-decoration tutor-decoration-one" />
      <div className="tutor-decoration tutor-decoration-two" />
      <div className="tutor-card-top">
        <div className="tutor-icon"><Icon name="sparkles" size={21} /></div>
        <span className="tutor-status"><span /> ĐANG SẴN SÀNG</span>
      </div>
      <div className="tutor-copy">
        <span className="eyebrow light-eyebrow">TRỢ LÝ HỌC TẬP AI</span>
        <h2 id="tutor-title">Có điều gì bạn đang thắc mắc?</h2>
        <p>Hỏi EduMind AI để được giải thích bài học theo cách dễ hiểu hơn.</p>
      </div>
      <a className="tutor-button" href="#tutor">Bắt đầu trò chuyện <Icon name="arrow" size={16} /></a>
      <div className="tutor-suggestions"><span>Gợi ý:</span><a href="#tutor">Giải thích vòng lặp for</a><a href="#tutor">Tạo câu hỏi ôn tập</a></div>
    </section>
  );
}

function GoalPanel() {
  return (
    <section className="panel goal-panel" aria-labelledby="goal-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MỤC TIÊU TUẦN</span>
          <h2 id="goal-title">Bạn đang đi đúng hướng</h2>
        </div>
        <div className="goal-badge">✦</div>
      </div>
      <div className="goal-progress-row"><strong>4 <span>/ 5 giờ</span></strong><span>80%</span></div>
      <div className="progress-track goal-track"><span style={{ width: "80%" }} /></div>
      <p className="goal-note">Thêm 1 giờ học nữa để hoàn thành mục tiêu tuần này.</p>
    </section>
  );
}

export default function Home() {
  return (
    <div className="app-shell" id="top">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="dashboard-content">
          <section className="welcome-row">
            <div>
              <span className="welcome-kicker">KHÔNG GIAN HỌC TẬP CỦA BẠN</span>
              <h1>Chào buổi sáng, Minh Anh <span aria-hidden="true">☀️</span></h1>
              <p>Mỗi bước nhỏ hôm nay sẽ đưa bạn đến gần mục tiêu hơn.</p>
            </div>
            <a className="quick-action" href="#courses"><span>+</span> Khám phá khóa học</a>
          </section>

          <section className="stats-grid" aria-label="Tổng quan học tập">
            <StatCard icon="clock" label="Thời gian học" value="4h 25m" detail="Tuần này" tone="stat-purple" />
            <StatCard icon="book" label="Khóa học đang học" value="03" detail="Tiếp tục phát huy" tone="stat-blue" />
            <StatCard icon="check" label="Bài học hoàn thành" value="12" detail="+3 bài tuần này" tone="stat-green" />
            <StatCard icon="chart" label="Điểm trung bình" value="8.6" detail="Tăng 0.4 điểm" tone="stat-orange" />
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-primary">
              <ContinueLearning />
              <section className="courses-section" id="courses" aria-labelledby="courses-title">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">TIẾP TỤC PHÁT TRIỂN</span>
                    <h2 id="courses-title">Khóa học của bạn</h2>
                  </div>
                  <a className="text-link" href="#courses">Tất cả khóa học <Icon name="arrow" size={15} /></a>
                </div>
                <div className="course-grid">
                  {courses.map((course) => <CourseCard course={course} key={course.title} />)}
                </div>
              </section>
              <WeeklyActivity />
            </div>
            <aside className="dashboard-secondary" aria-label="Kế hoạch và trợ lý học tập">
              <SchedulePanel />
              <GoalPanel />
              <TutorCard />
            </aside>
          </div>
          <footer className="dashboard-footer"><span>© 2026 EduMind AI</span><span>Học tập theo cách của bạn</span></footer>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
