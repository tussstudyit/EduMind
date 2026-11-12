// ============================================================================
// EDUMIND AI - STORAGE SERVICE LAYER (LocalStorage Mock Layer)
// Quản lý trạng thái toàn bộ 13 module với LocalStorage cho Next.js Client
// ============================================================================

import {
  User,
  UserRole,
  Subject,
  Topic,
  Course,
  Lesson,
  Material,
  Enrollment,
  Quiz,
  Question,
  QuizAttempt,
  StudentProgress,
  Conversation,
  ChatMessage,
  OCRScan,
  Recommendation,
  Notification,
  SystemLog,
  AIConfig,
} from "@/types";

import {
  initialUsers,
  initialSubjects,
  initialTopics,
  initialCourses,
  initialLessons,
  initialMaterials,
  initialEnrollments,
  initialQuizzes,
  initialQuestions,
  initialAttempts,
  initialProgress,
  initialConversations,
  initialMessages,
  initialOCRScans,
  initialRecommendations,
  initialNotifications,
  initialSystemLogs,
  initialAIConfig,
} from "@/mock/initialData";

const STORAGE_KEYS = {
  USERS: "edumind_users",
  SUBJECTS: "edumind_subjects",
  TOPICS: "edumind_topics",
  COURSES: "edumind_courses",
  LESSONS: "edumind_lessons",
  MATERIALS: "edumind_materials",
  ENROLLMENTS: "edumind_enrollments",
  QUIZZES: "edumind_quizzes",
  QUESTIONS: "edumind_questions",
  ATTEMPTS: "edumind_attempts",
  PROGRESS: "edumind_progress",
  CONVERSATIONS: "edumind_conversations",
  MESSAGES: "edumind_messages",
  OCR_SCANS: "edumind_ocr_scans",
  RECOMMENDATIONS: "edumind_recommendations",
  NOTIFICATIONS: "edumind_notifications",
  SYSTEM_LOGS: "edumind_system_logs",
  AI_CONFIG: "edumind_ai_config",
};

// Helper an toàn cho môi trường SSR của Next.js
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Lỗi đọc localStorage key ${key}:`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Lỗi ghi localStorage key ${key}:`, error);
  }
}

export const storageService = {
  // --------------------------------------------------------------------------
  // HỆ THỐNG: KHÔI PHỤC DỮ LIỆU GỐC
  // --------------------------------------------------------------------------
  resetToFactoryDefaults(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(initialSubjects));
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(initialTopics));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(initialCourses));
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(initialLessons));
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(initialMaterials));
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(initialEnrollments));
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(initialQuizzes));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(initialQuestions));
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(initialAttempts));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(initialProgress));
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(initialConversations));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(initialMessages));
    localStorage.setItem(STORAGE_KEYS.OCR_SCANS, JSON.stringify(initialOCRScans));
    localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(initialRecommendations));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
    localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(initialSystemLogs));
    localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(initialAIConfig));
  },

  // --------------------------------------------------------------------------
  // MODULE 1: TÀI KHOẢN VÀ PHÂN QUYỀN
  // --------------------------------------------------------------------------
  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, initialUsers);
  },

  saveUser(user: Partial<User> & { email: string; name: string; role: UserRole }): User {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: User = {
        ...users[existingIndex],
        ...user,
        updatedAt: now,
      };
      users[existingIndex] = updated;
      setItem(STORAGE_KEYS.USERS, users);
      this.addSystemLog("USER_UPDATED", `Cập nhật thông tin người dùng ${updated.name} (${updated.email})`);
      return updated;
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || "active",
        avatar: user.name.split(" ").slice(-1)[0].substring(0, 2).toUpperCase() || "ND",
        phone: user.phone || "",
        department: user.department || "",
        bio: user.bio || "",
        createdAt: now,
        updatedAt: now,
      };
      users.unshift(newUser);
      setItem(STORAGE_KEYS.USERS, users);
      this.addSystemLog("USER_CREATED", `Tạo tài khoản mới: ${newUser.name} [${newUser.role}]`);
      return newUser;
    }
  },

  toggleLockUser(userId: string): User | null {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    user.status = user.status === "active" ? "locked" : "active";
    user.updatedAt = new Date().toISOString();
    setItem(STORAGE_KEYS.USERS, users);
    this.addSystemLog(
      user.status === "locked" ? "USER_LOCKED" : "USER_UNLOCKED",
      `${user.status === "locked" ? "Khóa" : "Mở khóa"} tài khoản: ${user.name}`
    );
    return user;
  },

  login(email: string, pass: string): { success: boolean; user?: User; message: string } {
    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, message: "Email không tồn tại trong hệ thống." };
    }
    if (user.status === "locked") {
      return { success: false, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." };
    }
    this.addSystemLog("USER_LOGIN", `Người dùng ${user.name} (${user.role}) đăng nhập thành công.`);
    return { success: true, user, message: "Đăng nhập thành công!" };
  },

  register(name: string, email: string, role: UserRole = "student", phone?: string, dept?: string): { success: boolean; user?: User; message: string } {
    const users = this.getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      return { success: false, message: "Email này đã được sử dụng. Vui lòng chọn email khác." };
    }
    const newUser = this.saveUser({
      name: name.trim(),
      email: email.trim(),
      role,
      phone: phone?.trim(),
      department: dept?.trim(),
    });
    return { success: true, user: newUser, message: "Đăng ký tài khoản mới thành công!" };
  },

  changePassword(userId: string, oldPass: string, newPass: string): { success: boolean; message: string } {
    if (!oldPass || !newPass) {
      return { success: false, message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới." };
    }
    if (newPass.length < 6) {
      return { success: false, message: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
    }
    this.addSystemLog("PASSWORD_CHANGED", `Người dùng ID ${userId} đã đổi mật khẩu.`);
    return { success: true, message: "Đổi mật khẩu thành công!" };
  },

  // --------------------------------------------------------------------------
  // MODULE 2: MÔN HỌC VÀ CHỦ ĐỀ
  // --------------------------------------------------------------------------
  getSubjects(includeHidden: boolean = true): Subject[] {
    const list = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, initialSubjects);
    return includeHidden ? list : list.filter((s) => !s.isHidden);
  },

  saveSubject(subject: Partial<Subject> & { code: string; name: string }): Subject {
    const subjects = this.getSubjects(true);
    const index = subjects.findIndex((s) => s.id === subject.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      subjects[index] = { ...subjects[index], ...subject };
      setItem(STORAGE_KEYS.SUBJECTS, subjects);
      return subjects[index];
    } else {
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        code: subject.code.toUpperCase(),
        name: subject.name,
        description: subject.description || "",
        iconName: subject.iconName || "book",
        isHidden: !!subject.isHidden,
        topicCount: 0,
        courseCount: 0,
        createdAt: now,
      };
      subjects.unshift(newSubject);
      setItem(STORAGE_KEYS.SUBJECTS, subjects);
      return newSubject;
    }
  },

  toggleHideSubject(subjectId: string): Subject | null {
    const subjects = this.getSubjects(true);
    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return null;
    sub.isHidden = !sub.isHidden;
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
    return sub;
  },

  deleteSubject(subjectId: string): boolean {
    const subjects = this.getSubjects(true);
    const filtered = subjects.filter((s) => s.id !== subjectId);
    setItem(STORAGE_KEYS.SUBJECTS, filtered);
    return true;
  },

  // --- Quản lý Chủ đề con (Topics) ---
  getTopics(subjectId?: string, includeHidden: boolean = true): Topic[] {
    const list = getItem<Topic[]>(STORAGE_KEYS.TOPICS, initialTopics);
    let filtered = subjectId ? list.filter((t) => t.subjectId === subjectId) : list;
    if (!includeHidden) {
      filtered = filtered.filter((t) => !t.isHidden);
    }
    return filtered.sort((a, b) => a.order - b.order);
  },

  saveTopic(topic: Partial<Topic> & { subjectId: string; name: string }): Topic {
    const topics = getItem<Topic[]>(STORAGE_KEYS.TOPICS, initialTopics);
    const index = topics.findIndex((t) => t.id === topic.id);

    if (index >= 0) {
      topics[index] = { ...topics[index], ...topic };
      setItem(STORAGE_KEYS.TOPICS, topics);
      return topics[index];
    } else {
      const subjectTopics = topics.filter((t) => t.subjectId === topic.subjectId);
      const newTopic: Topic = {
        id: `top-${Date.now()}`,
        subjectId: topic.subjectId,
        name: topic.name,
        description: topic.description || "",
        order: topic.order || subjectTopics.length + 1,
        isHidden: !!topic.isHidden,
      };
      topics.push(newTopic);
      setItem(STORAGE_KEYS.TOPICS, topics);

      // Cập nhật số chủ đề trong Subject
      const subjects = this.getSubjects(true);
      const s = subjects.find((x) => x.id === topic.subjectId);
      if (s) {
        s.topicCount = (s.topicCount || 0) + 1;
        setItem(STORAGE_KEYS.SUBJECTS, subjects);
      }
      return newTopic;
    }
  },

  toggleHideTopic(topicId: string): Topic | null {
    const topics = getItem<Topic[]>(STORAGE_KEYS.TOPICS, initialTopics);
    const t = topics.find((item) => item.id === topicId);
    if (!t) return null;
    t.isHidden = !t.isHidden;
    setItem(STORAGE_KEYS.TOPICS, topics);
    return t;
  },

  deleteTopic(topicId: string): boolean {
    const topics = getItem<Topic[]>(STORAGE_KEYS.TOPICS, initialTopics);
    const target = topics.find((t) => t.id === topicId);
    if (!target) return false;

    const filtered = topics.filter((t) => t.id !== topicId);
    setItem(STORAGE_KEYS.TOPICS, filtered);

    // Giảm topicCount của Subject
    const subjects = this.getSubjects(true);
    const s = subjects.find((x) => x.id === target.subjectId);
    if (s && s.topicCount > 0) {
      s.topicCount -= 1;
      setItem(STORAGE_KEYS.SUBJECTS, subjects);
    }
    return true;
  },


  // --------------------------------------------------------------------------
  // MODULE 3: KHÓA HỌC
  // --------------------------------------------------------------------------
  getCourses(role: UserRole = "student", teacherId?: string): Course[] {
    const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    if (role === "admin") return courses;
    if (role === "teacher") {
      return teacherId ? courses.filter((c) => c.teacherId === teacherId) : courses;
    }
    // Student chỉ xem khóa học đã được xuất bản (published)
    return courses.filter((c) => c.status === "published");
  },

  getCourseById(courseId: string): Course | undefined {
    const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    return courses.find((c) => c.id === courseId);
  },

  saveCourse(course: Partial<Course> & { title: string; subjectId: string; teacherId: string }): Course {
    const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    const index = courses.findIndex((c) => c.id === course.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      courses[index] = { ...courses[index], ...course, updatedAt: now };
      setItem(STORAGE_KEYS.COURSES, courses);
      return courses[index];
    } else {
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        title: course.title,
        subjectId: course.subjectId,
        subjectName: course.subjectName || "LẬP TRÌNH",
        teacherId: course.teacherId,
        teacherName: course.teacherName || "Giảng viên",
        description: course.description || "",
        thumbnail: course.thumbnail || "/courses/default.png",
        level: course.level || "beginner",
        status: course.status || "draft",
        tone: course.tone || "lavender",
        badgeMark: course.badgeMark || "EDU",
        durationHours: course.durationHours || 10,
        lessonCount: 0,
        enrolledCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      courses.unshift(newCourse);
      setItem(STORAGE_KEYS.COURSES, courses);
      return newCourse;
    }
  },

  deleteCourse(courseId: string): boolean {
    const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    const filtered = courses.filter((c) => c.id !== courseId);
    setItem(STORAGE_KEYS.COURSES, filtered);
    return true;
  },

  // --------------------------------------------------------------------------
  // MODULE 4: BÀI HỌC VÀ TÀI LIỆU
  // --------------------------------------------------------------------------
  getLessons(courseId: string): Lesson[] {
    const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    return lessons
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  },

  saveLesson(lesson: Partial<Lesson> & { courseId: string; title: string }): Lesson {
    const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const index = lessons.findIndex((l) => l.id === lesson.id);

    if (index >= 0) {
      lessons[index] = { ...lessons[index], ...lesson };
      setItem(STORAGE_KEYS.LESSONS, lessons);
      return lessons[index];
    } else {
      const courseLessons = lessons.filter((l) => l.courseId === lesson.courseId);
      const newLesson: Lesson = {
        id: `les-${Date.now()}`,
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description || "",
        order: lesson.order || courseLessons.length + 1,
        durationMinutes: lesson.durationMinutes || 30,
        videoUrl: lesson.videoUrl,
        contentMarkdown: lesson.contentMarkdown || "Nội dung bài học đang được cập nhật...",
        isPublished: lesson.isPublished ?? true,
      };
      lessons.push(newLesson);
      setItem(STORAGE_KEYS.LESSONS, lessons);

      // Cập nhật số bài học trong khóa học
      const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
      const c = courses.find((x) => x.id === lesson.courseId);
      if (c) {
        c.lessonCount += 1;
        setItem(STORAGE_KEYS.COURSES, courses);
      }

      return newLesson;
    }
  },

  deleteLesson(lessonId: string): boolean {
    const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const target = lessons.find((l) => l.id === lessonId);
    if (!target) return false;

    const filtered = lessons.filter((l) => l.id !== lessonId);
    setItem(STORAGE_KEYS.LESSONS, filtered);

    // Giảm số bài học của Course
    const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    const c = courses.find((x) => x.id === target.courseId);
    if (c && c.lessonCount > 0) {
      c.lessonCount -= 1;
      setItem(STORAGE_KEYS.COURSES, courses);
    }
    return true;
  },

  reorderLesson(courseId: string, lessonId: string, direction: "up" | "down"): boolean {
    const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const courseLessons = lessons
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = courseLessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return false;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= courseLessons.length) return false;

    // Hoán đổi thuộc tính order
    const currentLesson = courseLessons[currentIndex];
    const targetLesson = courseLessons[targetIndex];

    const tempOrder = currentLesson.order;
    currentLesson.order = targetLesson.order;
    targetLesson.order = tempOrder;

    setItem(STORAGE_KEYS.LESSONS, lessons);
    return true;
  },

  getMaterials(courseId: string, lessonId?: string): Material[] {
    const materials = getItem<Material[]>(STORAGE_KEYS.MATERIALS, initialMaterials);
    let filtered = materials.filter((m) => m.courseId === courseId);
    if (lessonId) filtered = filtered.filter((m) => m.lessonId === lessonId);
    return filtered;
  },

  saveMaterial(mat: Partial<Material> & { courseId: string; title: string }): Material {
    const materials = getItem<Material[]>(STORAGE_KEYS.MATERIALS, initialMaterials);
    const index = materials.findIndex((m) => m.id === mat.id);

    if (index >= 0) {
      const updated = {
        ...materials[index],
        ...mat,
      };
      materials[index] = updated;
      setItem(STORAGE_KEYS.MATERIALS, materials);
      return updated;
    } else {
      const newMaterial: Material = {
        id: `mat-${Date.now()}`,
        courseId: mat.courseId,
        lessonId: mat.lessonId || "les-01",
        title: mat.title,
        description: mat.description || "",
        fileType: mat.fileType || "pdf",
        fileUrl: mat.fileUrl || `/materials/${mat.title.toLowerCase().replace(/\s+/g, "-")}.${mat.fileType || "pdf"}`,
        fileSize: mat.fileSize || "1.5 MB",
        uploadedAt: new Date().toISOString(),
      };
      materials.unshift(newMaterial);
      setItem(STORAGE_KEYS.MATERIALS, materials);
      return newMaterial;
    }
  },

  deleteMaterial(materialId: string): boolean {
    const materials = getItem<Material[]>(STORAGE_KEYS.MATERIALS, initialMaterials);
    const filtered = materials.filter((m) => m.id !== materialId);
    setItem(STORAGE_KEYS.MATERIALS, filtered);
    return true;
  },

  // --------------------------------------------------------------------------
  // MODULE 5: GHI DANH KHÓA HỌC
  // --------------------------------------------------------------------------
  getEnrollments(studentId?: string, courseId?: string): Enrollment[] {
    const list = getItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, initialEnrollments);
    let res = list;
    if (studentId) res = res.filter((e) => e.studentId === studentId);
    if (courseId) res = res.filter((e) => e.courseId === courseId);
    return res;
  },

  enrollCourse(courseId: string, student: User): Enrollment {
    const enrollments = getItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, initialEnrollments);
    const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    const course = courses.find((c) => c.id === courseId);

    const existing = enrollments.find(
      (e) => e.courseId === courseId && e.studentId === student.id
    );

    if (existing) {
      existing.status = "active";
      setItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
      return existing;
    }

    const newEnr: Enrollment = {
      id: `enr-${Date.now()}`,
      courseId,
      courseTitle: course ? course.title : "Khóa học",
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      studentEmail: student.email,
      enrolledAt: new Date().toISOString(),
      status: "active",
      progressPercent: 0,
      lastAccessedAt: new Date().toISOString(),
    };

    enrollments.unshift(newEnr);
    setItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

    if (course) {
      course.enrolledCount += 1;
      setItem(STORAGE_KEYS.COURSES, courses);
    }
    return newEnr;
  },

  dropCourse(courseId: string, studentId: string): boolean {
    const enrollments = getItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, initialEnrollments);
    const enr = enrollments.find((e) => e.courseId === courseId && e.studentId === studentId);
    if (!enr) return false;

    enr.status = "dropped";
    setItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

    const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    const course = courses.find((c) => c.id === courseId);
    if (course && course.enrolledCount > 0) {
      course.enrolledCount -= 1;
      setItem(STORAGE_KEYS.COURSES, courses);
    }
    return true;
  },

  // --------------------------------------------------------------------------
  // MODULE 6: BÀI TẬP, BÀI KIỂM TRA VÀ CÂU HỎI
  // --------------------------------------------------------------------------
  getQuizzes(courseId?: string): Quiz[] {
    const quizzes = getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, initialQuizzes);
    return courseId ? quizzes.filter((q) => q.courseId === courseId) : quizzes;
  },

  saveQuiz(quiz: Partial<Quiz> & { title: string; courseId: string }): Quiz {
    const quizzes = getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, initialQuizzes);
    const index = quizzes.findIndex((q) => q.id === quiz.id);

    if (index >= 0) {
      quizzes[index] = { ...quizzes[index], ...quiz };
      setItem(STORAGE_KEYS.QUIZZES, quizzes);
      return quizzes[index];
    } else {
      const courses = getItem<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
      const c = courses.find((x) => x.id === quiz.courseId);

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: quiz.title,
        courseId: quiz.courseId,
        courseTitle: c ? c.title : "Khóa học",
        lessonId: quiz.lessonId,
        description: quiz.description || "",
        timeLimitMinutes: quiz.timeLimitMinutes || 15,
        passingScore: quiz.passingScore || 5,
        maxScore: quiz.maxScore || 10,
        isPublished: quiz.isPublished ?? true,
        questionCount: 0,
        createdAt: new Date().toISOString(),
      };
      quizzes.unshift(newQuiz);
      setItem(STORAGE_KEYS.QUIZZES, quizzes);
      return newQuiz;
    }
  },

  deleteQuiz(quizId: string): boolean {
    const quizzes = getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, initialQuizzes);
    const filtered = quizzes.filter((q) => q.id !== quizId);
    setItem(STORAGE_KEYS.QUIZZES, filtered);
    return true;
  },

  // RBAC BẢO MẬT: Nếu là student thì ẩn `isCorrect` khỏi các phương án
  getQuestions(quizId: string, userRole: UserRole = "student"): Question[] {
    const questions = getItem<Question[]>(STORAGE_KEYS.QUESTIONS, initialQuestions);
    const list = questions.filter((q) => q.quizId === quizId);

    if (userRole === "student") {
      return list.map((q) => ({
        ...q,
        explanation: undefined, // Ẩn giải thích chi tiết khi học sinh làm bài
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          // Không đính kèm isCorrect cho Student!
        })),
      }));
    }

    // Teacher & Admin thấy đầy đủ đáp án đúng và lời giải
    return list;
  },

  saveQuestion(question: Omit<Question, "id"> & { id?: string }): Question {
    const questions = getItem<Question[]>(STORAGE_KEYS.QUESTIONS, initialQuestions);
    const index = questions.findIndex((q) => q.id === question.id);

    if (index >= 0) {
      questions[index] = { ...questions[index], ...question };
      setItem(STORAGE_KEYS.QUESTIONS, questions);
      return questions[index];
    } else {
      const newQ: Question = {
        ...question,
        id: `q-${Date.now()}`,
      };
      questions.push(newQ);
      setItem(STORAGE_KEYS.QUESTIONS, questions);

      // Cập nhật số câu hỏi trong Quiz
      const quizzes = getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, initialQuizzes);
      const quiz = quizzes.find((qz) => qz.id === question.quizId);
      if (quiz) {
        quiz.questionCount += 1;
        setItem(STORAGE_KEYS.QUIZZES, quizzes);
      }
      return newQ;
    }
  },

  deleteQuestion(questionId: string): boolean {
    const questions = getItem<Question[]>(STORAGE_KEYS.QUESTIONS, initialQuestions);
    const q = questions.find((x) => x.id === questionId);
    if (!q) return false;

    const filtered = questions.filter((x) => x.id !== questionId);
    setItem(STORAGE_KEYS.QUESTIONS, filtered);

    const quizzes = getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, initialQuizzes);
    const quiz = quizzes.find((qz) => qz.id === q.quizId);
    if (quiz && quiz.questionCount > 0) {
      quiz.questionCount -= 1;
      setItem(STORAGE_KEYS.QUIZZES, quizzes);
    }
    return true;
  },

  // --------------------------------------------------------------------------
  // MODULE 7: BÀI LÀM VÀ CHẤM ĐIỂM
  // --------------------------------------------------------------------------
  getAttempts(quizId?: string, studentId?: string): QuizAttempt[] {
    const attempts = getItem<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, initialAttempts);
    let res = attempts;
    if (quizId) res = res.filter((a) => a.quizId === quizId);
    if (studentId) res = res.filter((a) => a.studentId === studentId);
    return res;
  },

  startOrGetAttempt(quizId: string, student: User): QuizAttempt {
    const attempts = getItem<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, initialAttempts);
    const existing = attempts.find(
      (a) => a.quizId === quizId && a.studentId === student.id
    );

    if (existing) return existing;

    const quizzes = getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, initialQuizzes);
    const quiz = quizzes.find((q) => q.id === quizId);

    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId,
      quizTitle: quiz ? quiz.title : "Bài kiểm tra",
      courseId: quiz ? quiz.courseId : "",
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      status: "in_progress",
      answers: [],
      totalScore: 0,
      maxScore: quiz ? quiz.maxScore : 10,
      startedAt: new Date().toISOString(),
    };
    attempts.unshift(newAttempt);
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);
    return newAttempt;
  },

  saveAttemptDraft(attemptId: string, answers: QuizAttempt["answers"]): QuizAttempt | null {
    const attempts = getItem<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, initialAttempts);
    const att = attempts.find((a) => a.id === attemptId);
    if (!att || att.status !== "in_progress") return null;

    att.answers = answers;
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);
    return att;
  },

  submitAttempt(attemptId: string, answers: QuizAttempt["answers"]): QuizAttempt | null {
    const attempts = getItem<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, initialAttempts);
    const att = attempts.find((a) => a.id === attemptId);
    if (!att) return null;

    att.answers = answers;
    att.status = "submitted"; // Khóa nội dung bài làm sau khi nộp
    att.submittedAt = new Date().toISOString();

    // Tự động chấm điểm các câu trắc nghiệm
    const questions = getItem<Question[]>(STORAGE_KEYS.QUESTIONS, initialQuestions);
    let autoScore = 0;

    att.answers.forEach((ans) => {
      const q = questions.find((item) => item.id === ans.questionId);
      if (q && q.type === "multiple_choice") {
        const correctOpt = q.options.find((opt) => opt.isCorrect);
        if (correctOpt && ans.selectedOptionId === correctOpt.id) {
          ans.scoreAwarded = q.points;
          autoScore += q.points;
        } else {
          ans.scoreAwarded = 0;
        }
      }
    });

    att.totalScore = Number(autoScore.toFixed(2));
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);

    // Thông báo cho Giảng viên
    this.addNotification(
      "teacher-01",
      "Bài nộp kiểm tra mới",
      `Học viên ${att.studentName} đã nộp bài '${att.quizTitle}'.`,
      "warning",
      "#grading"
    );

    return att;
  },

  gradeAttempt(
    attemptId: string,
    grades: { questionId: string; scoreAwarded: number; teacherFeedback?: string }[],
    teacherNotes: string,
    teacherName: string
  ): QuizAttempt | null {
    const attempts = getItem<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, initialAttempts);
    const att = attempts.find((a) => a.id === attemptId);
    if (!att) return null;

    let finalScore = 0;
    att.answers.forEach((ans) => {
      const g = grades.find((item) => item.questionId === ans.questionId);
      if (g) {
        ans.scoreAwarded = g.scoreAwarded;
        ans.teacherFeedback = g.teacherFeedback;
      }
      finalScore += ans.scoreAwarded || 0;
    });

    att.totalScore = Number(finalScore.toFixed(2));
    att.status = "graded";
    att.gradedAt = new Date().toISOString();
    att.gradedBy = teacherName;
    att.teacherNotes = teacherNotes;

    setItem(STORAGE_KEYS.ATTEMPTS, attempts);

    // Gửi thông báo cho Học viên
    this.addNotification(
      att.studentId,
      "Bài kiểm tra đã được chấm điểm",
      `Giảng viên ${teacherName} đã chấm bài '${att.quizTitle}'. Điểm của bạn: ${att.totalScore}/${att.maxScore}.`,
      "success"
    );

    return att;
  },

  // --------------------------------------------------------------------------
  // MODULE 8: TIẾN ĐỘ HỌC TẬP
  // --------------------------------------------------------------------------
  getProgress(studentId: string, courseId: string): StudentProgress | undefined {
    const list = getItem<StudentProgress[]>(STORAGE_KEYS.PROGRESS, initialProgress);
    return list.find((p) => p.studentId === studentId && p.courseId === courseId);
  },

  markLessonCompleted(studentId: string, courseId: string, lessonId: string): StudentProgress {
    const list = getItem<StudentProgress[]>(STORAGE_KEYS.PROGRESS, initialProgress);
    let p = list.find((item) => item.studentId === studentId && item.courseId === courseId);
    const lessons = this.getLessons(courseId);
    const totalLessons = lessons.length || 1;

    if (!p) {
      p = {
        id: `prog-${Date.now()}`,
        studentId,
        courseId,
        completedLessonIds: [lessonId],
        lastLessonId: lessonId,
        lastStudiedAt: new Date().toISOString(),
        percentCompleted: Math.round((1 / totalLessons) * 100),
        totalMinutesStudied: 30,
      };
      list.push(p);
    } else {
      if (!p.completedLessonIds.includes(lessonId)) {
        p.completedLessonIds.push(lessonId);
      }
      p.lastLessonId = lessonId;
      p.lastStudiedAt = new Date().toISOString();
      p.percentCompleted = Math.min(100, Math.round((p.completedLessonIds.length / totalLessons) * 100));
      p.totalMinutesStudied += 25;
    }

    setItem(STORAGE_KEYS.PROGRESS, list);

    // Cập nhật % tiến độ trong bảng Enrollment
    const enrollments = getItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, initialEnrollments);
    const enr = enrollments.find((e) => e.studentId === studentId && e.courseId === courseId);
    if (enr) {
      enr.progressPercent = p.percentCompleted;
      enr.lastAccessedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
    }

    return p;
  },

  // --------------------------------------------------------------------------
  // MODULE 9: TRỢ LÝ HỌC TẬP AI (AI TUTOR)
  // --------------------------------------------------------------------------
  getConversations(studentId: string, showArchived: boolean = false): Conversation[] {
    const list = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, initialConversations);
    return list
      .filter((c) => c.studentId === studentId && (showArchived ? c.isArchived : !c.isArchived))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  createConversation(studentId: string, title: string, courseId?: string): Conversation {
    const list = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, initialConversations);
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      studentId,
      courseId,
      title: title || "Cuộc trò chuyện mới với AI Tutor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
    };
    list.unshift(newConv);
    setItem(STORAGE_KEYS.CONVERSATIONS, list);

    // Tạo tin nhắn chào mừng
    const messages = getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES, initialMessages);
    messages.push({
      id: `msg-${Date.now()}`,
      conversationId: newConv.id,
      sender: "assistant",
      content: `Xin chào! Tôi là **EduMind AI Tutor**. Tôi có thể giúp bạn giải đáp bài học, giải thích lỗi code, hoặc tóm tắt kiến thức. Bạn muốn tìm hiểu về nội dung nào?`,
      timestamp: new Date().toISOString(),
      suggestions: [
        "Giải thích cú pháp vòng lặp for",
        "Tạo câu hỏi trắc nghiệm kiểm tra kiến thức",
        "Cách giải bài tập ma trận nghịch đảo",
      ],
    });
    setItem(STORAGE_KEYS.MESSAGES, messages);
    return newConv;
  },

  deleteConversation(conversationId: string): boolean {
    const list = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, initialConversations);
    const filtered = list.filter((c) => c.id !== conversationId);
    setItem(STORAGE_KEYS.CONVERSATIONS, filtered);
    return true;
  },

  renameConversation(conversationId: string, newTitle: string): boolean {
    const list = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, initialConversations);
    const conv = list.find((c) => c.id === conversationId);
    if (!conv) return false;
    conv.title = newTitle;
    conv.updatedAt = new Date().toISOString();
    setItem(STORAGE_KEYS.CONVERSATIONS, list);
    return true;
  },

  toggleArchiveConversation(conversationId: string): boolean {
    const list = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, initialConversations);
    const conv = list.find((c) => c.id === conversationId);
    if (!conv) return false;
    conv.isArchived = !conv.isArchived;
    conv.updatedAt = new Date().toISOString();
    setItem(STORAGE_KEYS.CONVERSATIONS, list);
    return true;
  },

  getMessages(conversationId: string): ChatMessage[] {
    const list = getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES, initialMessages);
    return list
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage(conversationId: string, content: string): { userMsg: ChatMessage; assistantMsg: ChatMessage } {
    const messages = getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES, initialMessages);
    const now = new Date().toISOString();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      sender: "user",
      content,
      timestamp: now,
    };
    messages.push(userMsg);

    // Giả lập câu trả lời thông minh của EduMind AI
    const lower = content.toLowerCase();
    let replyText = `Cảm ơn câu hỏi của bạn! Dưới đây là phân tích chi tiết từ EduMind AI:\n\n- **Vấn đề cốt lõi:** ${content}\n- **Giải thích:** Trong học tập, việc hiểu bản chất từng khái niệm là then chốt. Hãy chia nhỏ bài toán thành các bước tuần tự và kiểm tra lại từng dòng logic.\n\nBạn có muốn tôi đưa ra một ví dụ code minh họa cụ thể không?`;

    if (lower.includes("for") || lower.includes("vòng lặp") || lower.includes("loop")) {
      replyText = `**Giải thích về Vòng lặp For trong Python:**\n\nVòng lặp \`for\` được thiết kế để duyệt tuần tự qua các phần tử của một chuỗi (như list, tuple, string) hoặc một dãy số được tạo bởi \`range()\`.\n\n\`\`\`python\nfor i in range(1, 5):\n    print("Lặp lần thứ:", i)\n\`\`\`\n\n**Mẹo ghi nhớ:** Không cần khởi tạo biến đếm hay tăng biến đếm thủ công như \`while\`, Python tự động quản lý index cho bạn!`;
    } else if (lower.includes("ma trận") || lower.includes("định thức") || lower.includes("matrix")) {
      replyText = `**Cách tính định thức (Determinant) ma trận cấp 2:**\n\nCho ma trận $A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$, định thức được tính bằng:\n$$\\det(A) = ad - bc$$\n\nNếu $\\det(A) \\neq 0$, ma trận có nghịch đảo $A^{-1}$.`;
    } else if (lower.includes("ocr") || lower.includes("đạo hàm") || lower.includes("bài tập")) {
      replyText = `**Hướng dẫn giải bài tập từ tài liệu vừa quét:**\n\n1. **Đạo hàm:** Áp dụng công thức đạo hàm hàm đa thức $(x^n)' = n \\cdot x^{n-1}$:\n   $$f'(x) = 6x + 5$$\n2. **Đệ quy Fibonacci:** Điều kiện dừng $n \\le 1$, trả về $n$; bước đệ quy trả về $fib(n-1) + fib(n-2)$.`;
    }

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      conversationId,
      sender: "assistant",
      content: replyText,
      timestamp: new Date(Date.now() + 800).toISOString(),
      suggestions: [
        "Cho tôi một bài tập mẫu tương tự",
        "Giải thích chi tiết hơn từng bước",
        "Có lưu ý gì khi làm dạng bài này không?",
      ],
    };
    messages.push(assistantMsg);

    setItem(STORAGE_KEYS.MESSAGES, messages);

    // Cập nhật thời gian conversation
    const convs = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, initialConversations);
    const conv = convs.find((c) => c.id === conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.CONVERSATIONS, convs);
    }

    return { userMsg, assistantMsg };
  },

  // --------------------------------------------------------------------------
  // MODULE 10: QUÉT TÀI LIỆU OCR
  // --------------------------------------------------------------------------
  getOCRScans(studentId: string): OCRScan[] {
    const list = getItem<OCRScan[]>(STORAGE_KEYS.OCR_SCANS, initialOCRScans);
    return list.filter((s) => s.studentId === studentId);
  },

  addOCRScan(studentId: string, fileName: string, imageUrl: string, rawText?: string, initialStatus: OCRScan["status"] = "processing"): OCRScan {
    const list = getItem<OCRScan[]>(STORAGE_KEYS.OCR_SCANS, initialOCRScans);
    const detected =
      rawText ||
      `Đề bài tập tự động nhận diện từ tài liệu [${fileName}]:\n1. Tính đạo hàm của f(x) = 3x^2 + 5x - 7\n2. Viết hàm đệ quy tính số Fibonacci thứ n trong Python.`;

    const newScan: OCRScan = {
      id: `ocr-${Date.now()}`,
      studentId,
      fileName,
      imageUrl,
      recognizedText: initialStatus === "processing" ? "Đang chờ xử lý nhận diện ký tự qua OCR Engine..." : detected,
      correctedText: initialStatus === "processing" ? "Đang chờ xử lý..." : detected,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      sentToAI: false,
    };
    list.unshift(newScan);
    setItem(STORAGE_KEYS.OCR_SCANS, list);
    return newScan;
  },

  updateOCRStatus(scanId: string, status: OCRScan["status"], recognizedText?: string): OCRScan | null {
    const list = getItem<OCRScan[]>(STORAGE_KEYS.OCR_SCANS, initialOCRScans);
    const scan = list.find((s) => s.id === scanId);
    if (!scan) return null;

    scan.status = status;
    if (recognizedText) {
      scan.recognizedText = recognizedText;
      scan.correctedText = recognizedText;
    }
    setItem(STORAGE_KEYS.OCR_SCANS, list);
    return scan;
  },

  updateOCRText(scanId: string, correctedText: string): OCRScan | null {
    const list = getItem<OCRScan[]>(STORAGE_KEYS.OCR_SCANS, initialOCRScans);
    const scan = list.find((s) => s.id === scanId);
    if (!scan) return null;

    scan.correctedText = correctedText;
    setItem(STORAGE_KEYS.OCR_SCANS, list);
    return scan;
  },

  sendOCRToAI(scanId: string, studentId: string): Conversation {
    const list = getItem<OCRScan[]>(STORAGE_KEYS.OCR_SCANS, initialOCRScans);
    const scan = list.find((s) => s.id === scanId);
    if (scan) {
      scan.sentToAI = true;
      setItem(STORAGE_KEYS.OCR_SCANS, list);
    }

    // Tạo cuộc hội thoại AI Tutor từ nội dung OCR
    const title = scan ? `Giải bài tập: ${scan.fileName.substring(0, 20)}...` : "Giải bài tập từ tài liệu OCR";
    const conv = this.createConversation(studentId, title);

    if (scan) {
      this.sendMessage(
        conv.id,
        `Chào AI Tutor, mình vừa quét tài liệu OCR có nội dung như sau. Hãy hướng dẫn mình giải chi tiết nhé:\n\n${scan.correctedText}`
      );
    }
    return conv;
  },

  deleteOCRScan(scanId: string): boolean {
    const list = getItem<OCRScan[]>(STORAGE_KEYS.OCR_SCANS, initialOCRScans);
    const filtered = list.filter((s) => s.id !== scanId);
    setItem(STORAGE_KEYS.OCR_SCANS, filtered);
    return true;
  },

  // --------------------------------------------------------------------------
  // MODULE 11: ĐỀ XUẤT HỌC TẬP
  // --------------------------------------------------------------------------
  getRecommendations(studentId: string): Recommendation[] {
    const list = getItem<Recommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, initialRecommendations);
    return list.filter((r) => r.studentId === studentId && !r.isDismissed);
  },

  markRecommendationRead(recId: string): void {
    const list = getItem<Recommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, initialRecommendations);
    const rec = list.find((r) => r.id === recId);
    if (rec) {
      rec.isRead = true;
      setItem(STORAGE_KEYS.RECOMMENDATIONS, list);
    }
  },

  dismissRecommendation(recId: string): void {
    const list = getItem<Recommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, initialRecommendations);
    const rec = list.find((r) => r.id === recId);
    if (rec) {
      rec.isDismissed = true;
      setItem(STORAGE_KEYS.RECOMMENDATIONS, list);
    }
  },

  // --------------------------------------------------------------------------
  // MODULE 12: THÔNG BÁO
  // --------------------------------------------------------------------------
  getNotifications(userId: string): Notification[] {
    const list = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    return list
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationRead(notificationId: string): void {
    const list = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const notif = list.find((n) => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  markAllNotificationsRead(userId: string): void {
    const list = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    list.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  deleteNotification(notificationId: string): void {
    const list = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const filtered = list.filter((n) => n.id !== notificationId);
    setItem(STORAGE_KEYS.NOTIFICATIONS, filtered);
  },

  addNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification["type"] = "info",
    link?: string
  ): Notification {
    const list = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
      link,
    };
    list.unshift(newNotif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotif;
  },

  // --------------------------------------------------------------------------
  // MODULE 13: BÁO CÁO, NHẬT KÝ VÀ CẤU HÌNH AI
  // --------------------------------------------------------------------------
  getSystemLogs(): SystemLog[] {
    const list = getItem<SystemLog[]>(STORAGE_KEYS.SYSTEM_LOGS, initialSystemLogs);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addSystemLog(action: string, details: string, level: SystemLog["level"] = "info"): void {
    const list = getItem<SystemLog[]>(STORAGE_KEYS.SYSTEM_LOGS, initialSystemLogs);
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      level,
      action,
      actorId: "system",
      actorName: "Hệ thống EduMind",
      actorRole: "admin",
      timestamp: new Date().toISOString(),
      details,
    };
    list.unshift(newLog);
    setItem(STORAGE_KEYS.SYSTEM_LOGS, list.slice(0, 50)); // Giữ tối đa 50 log gần nhất
  },

  getAIConfig(): AIConfig {
    return getItem<AIConfig>(STORAGE_KEYS.AI_CONFIG, initialAIConfig);
  },

  updateAIConfig(config: Partial<AIConfig>): AIConfig {
    const current = this.getAIConfig();
    const updated: AIConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.AI_CONFIG, updated);
    this.addSystemLog("AI_CONFIG_UPDATED", `Cập nhật cấu hình mô hình AI: ${updated.modelName} [${updated.ocrEngine}]`);
    return updated;
  },
};
