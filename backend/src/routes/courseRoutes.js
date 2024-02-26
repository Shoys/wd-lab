import express from 'express';
import {
  createCourse,
  deleteCourse,
  editCourse,
  listCreatedCourses,
  addStudentToCourse,
  listStudentsInCourse,
  listStudentCourses,
  getCourseDetail,
  getAllCourses,
  sendCourseRequest,
  getCourseRequests,
  respondToCourseRequest
} from '../controllers/courseController.js';

// Assuming you have some authentication middleware
import { protect, teacherProtect, studentProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/courses', getAllCourses);

// Teacher-specific routes
router.post('/teacher/courses/create', protect, teacherProtect, createCourse);
router.delete('/teacher/courses/delete/:courseId', protect, teacherProtect, deleteCourse);
router.post('/teacher/courses/edit/:courseId', protect, teacherProtect, editCourse);
router.get('/teacher/courses/created', protect, teacherProtect, listCreatedCourses);
router.post('/teacher/courses/:courseId/add-student', protect, teacherProtect, addStudentToCourse);
router.get('/teacher/courses/:courseId/students', protect, teacherProtect, listStudentsInCourse);
router.get('/teacher/courses/:courseId', protect, teacherProtect, getCourseDetail);
router.get('/teacher/courses/:courseId/requests', protect, teacherProtect, getCourseRequests);
router.post('/teacher/courses/:courseId/requests/:requestId', protect, teacherProtect, respondToCourseRequest);

// User-specific routes
router.get('/student/courses/my', protect, studentProtect, listStudentCourses);
router.get('/student/courses/:courseId', protect, studentProtect, getCourseDetail);
router.post('/student/courses/:courseId/request', protect, studentProtect, sendCourseRequest);

// Course request routes

// Export the router
export default router;
