import { apiClient } from "@/services/apiClient";
import { storageService } from "@/services/storageService";
import { Course, Enrollment, Lesson, Material, Subject, User, UserRole } from "@/types";

type CourseInput = Partial<Course> & Pick<Course, "title" | "subjectId" | "teacherId">;
type LessonInput = Partial<Lesson> & Pick<Lesson, "courseId" | "title">;

export const courseDataService = {
  isUsingRemoteData(): boolean {
    return true;
  },

  async getCourses(_role?: UserRole, _teacherId?: string): Promise<Course[]> {
    try {
      return await apiClient.getCourses();
    } catch {
      return [];
    }
  },

  async getSubjects(includeHidden = false): Promise<Subject[]> {
    try {
      return await apiClient.getSubjects(includeHidden);
    } catch {
      return [];
    }
  },

  saveCourse(course: CourseInput): Promise<Course> {
    if (course.id) {
      return apiClient.updateCourse(course.id, {
        subjectId: course.subjectId,
        subjectName: course.subjectName,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        level: course.level,
        status: course.status,
        tone: course.tone,
        badgeMark: course.badgeMark,
        durationHours: course.durationHours,
      });
    }
    return apiClient.createCourse({
      title: course.title,
      subjectId: course.subjectId,
      subjectName: course.subjectName,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      description: course.description,
      thumbnail: course.thumbnail,
      level: course.level,
      status: course.status,
      tone: course.tone,
      badgeMark: course.badgeMark,
      durationHours: course.durationHours,
    });
  },

  deleteCourse(courseId: string): Promise<unknown> {
    return apiClient.deleteCourse(courseId);
  },

  async getLessons(courseId: string): Promise<Lesson[]> {
    try {
      return await apiClient.getLessons(courseId);
    } catch {
      return [];
    }
  },

  saveLesson(lesson: LessonInput): Promise<Lesson> {
    const resolvedStatus = lesson.status ?? (lesson.isPublished === false ? "draft" : "published");
    if (lesson.id) {
      return apiClient.updateLesson(lesson.id, {
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        videoUrl: lesson.videoUrl,
        contentMarkdown: lesson.contentMarkdown,
        status: resolvedStatus,
        isPublished: resolvedStatus === "published",
      });
    }
    return apiClient.createLesson({
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      durationMinutes: lesson.durationMinutes,
      videoUrl: lesson.videoUrl,
      contentMarkdown: lesson.contentMarkdown,
      status: resolvedStatus,
      isPublished: resolvedStatus === "published",
    });
  },

  deleteLesson(lessonId: string): Promise<unknown> {
    return apiClient.deleteLesson(lessonId);
  },

  async reorderLesson(courseId: string, lessonId: string, direction: "up" | "down"): Promise<Lesson[]> {
    return apiClient.reorderLesson(courseId, lessonId, direction);
  },

  async getMaterials(courseId?: string, lessonId?: string): Promise<Material[]> {
    try {
      return await apiClient.getMaterials(courseId, lessonId);
    } catch {
      return [];
    }
  },

  saveMaterial(
    mat: Partial<Material> & { courseId: string; lessonId: string; title: string; fileUrl: string },
    isUpdate = false,
  ): Promise<Material> {
    if (isUpdate && mat.id) {
      return apiClient.updateMaterial(mat.id, {
        courseId: mat.courseId,
        lessonId: mat.lessonId,
        title: mat.title,
        description: mat.description,
        fileType: mat.fileType,
        fileUrl: mat.fileUrl,
        fileSize: mat.fileSize,
      });
    }
    return apiClient.createMaterial({
      id: mat.id,
      courseId: mat.courseId,
      lessonId: mat.lessonId,
      title: mat.title,
      description: mat.description,
      fileType: mat.fileType,
      fileUrl: mat.fileUrl,
      fileSize: mat.fileSize,
    });
  },

  deleteMaterial(materialId: string): Promise<unknown> {
    return apiClient.deleteMaterial(materialId);
  },

  async getEnrollments(role: UserRole, userId?: string, courseId?: string): Promise<Enrollment[]> {
    try {
      return await apiClient.getEnrollments(role === "student" ? userId : undefined, courseId);
    } catch {
      return storageService.getEnrollments(userId, courseId);
    }
  },

  enrollCourse(courseId: string, _student?: User): Promise<Enrollment> {
    return apiClient.enrollCourse(courseId);
  },

  dropCourse(courseId: string, _studentId?: string): Promise<Enrollment> {
    return apiClient.dropCourse(courseId);
  },
};
