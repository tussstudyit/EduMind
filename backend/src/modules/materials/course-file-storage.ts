import { join } from 'node:path';

export const COURSE_FILE_DIRECTORY = process.env.COURSE_FILE_DIRECTORY || join(process.cwd(), 'uploads', 'course');

export interface UploadedCourseFile {
  filename: string;
  path: string;
  originalname: string;
}
