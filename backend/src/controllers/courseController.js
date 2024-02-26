import Course from '../models/Course.js';
import CourseRequest from '../models/CourseRequest.js'

// Helper function to check if the user is the course creator
const isCourseCreator = async (userId, courseId) => {
  const course = await Course.findById(courseId);
  return course && course.creator.toString() === userId.toString();
};

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('creator', 'name');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  const { name, description } = req.body;
  try {
    const newCourse = new Course({
      name,
      description,
      creator: req.user._id, // Assuming req.user is populated by authentication middleware
    });
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course', error: error.message });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    if (!await isCourseCreator(req.user._id, courseId)) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }
    await Course.findByIdAndDelete(courseId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course', error: error.message });
  }
};

// Edit a course
export const editCourse = async (req, res) => {
  const { courseId } = req.params;
  const { name, description } = req.body;
  try {
    if (!await isCourseCreator(req.user._id, courseId)) {
      return res.status(403).json({ message: 'Not authorized to edit this course' });
    }
    const updatedCourse = await Course.findByIdAndUpdate(courseId, { name, description }, { new: true });
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Failed to edit course', error: error.message });
  }
};

// List courses created by the teacher
export const listCreatedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ creator: req.user._id });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list courses', error: error.message });
  }
};

// Add a student to a course
export const addStudentToCourse = async (req, res) => {
  const { courseId } = req.params;
  const { userId } = req.body; // ID of the student to add
  try {
    if (!await isCourseCreator(req.user._id, courseId)) {
      return res.status(403).json({ message: 'Not authorized to add students to this course' });
    }
    const course = await Course.findById(courseId);
    if (!course.students.includes(userId)) {
      course.students.push(userId);
      await course.save();
      res.json({ message: 'Student added successfully' });
    } else {
      res.status(400).json({ message: 'Student already added to the course' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to add student to course', error: error.message });
  }
};

// List students in a course
export const listStudentsInCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    if (!await isCourseCreator(req.user._id, courseId)) {
      return res.status(403).json({ message: 'Not authorized to view students in this course' });
    }
    const course = await Course.findById(courseId).populate('students', 'name username');
    res.json(course.students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list students in course', error: error.message });
  }
};

// List courses a student has been added to
export const listStudentCourses = async (req, res) => {
  try {
    const studentId = req.user._id; // Assuming req.user is populated by authentication middleware
    const courses = await Course.find({ students: studentId });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list student courses', error: error.message });
  }
};

// Get detailed information about a specific course
export const getCourseDetail = async (req, res) => {
  const { courseId } = req.params; // Ensure courseId is correctly parsed from the URL
  try {
    const course = await Course.findById(courseId)
      .populate('creator', 'name') // Assuming you want to include the creator's name
      .populate('students', 'name'); // And possibly the names of enrolled students

    // Check if the course exists
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the requesting student is enrolled in the course or the course is public/open
    if (!course.students.map(student => student._id.toString()).includes(req.user._id.toString()) && course.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this course' });
    }

    res.json(course);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Failed to get course details', error: error.message });
  }
};


// POST /student/courses/:courseId/request
export const sendCourseRequest = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id; // Assuming req.user is set by studentProtect middleware

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Prevent duplicate requests
    const existingRequest = await CourseRequest.findOne({ student: studentId, course: courseId });
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already exists' });
    }

    // Create a new course request
    const courseRequest = await CourseRequest.create({
      student: studentId,
      course: courseId,
      status: 'pending',
    });

    res.status(201).json(courseRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /teacher/courses/:courseId/requests
export const getCourseRequests = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id; // Assuming req.user is set by teacherProtect middleware

    // Ensure the teacher owns the course
    const course = await Course.findOne({ _id: courseId, creator: teacherId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission' });
    }

    // Fetch pending requests
    const requests = await CourseRequest.find({ course: courseId, status: 'pending' })
      .populate('student', 'name username');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /teacher/courses/:courseId/requests/:requestId
export const respondToCourseRequest = async (req, res) => {
  try {
    const { courseId, requestId } = req.params;
    const { allow } = req.body; // true or false
    const teacherId = req.user._id;

    // Ensure the teacher owns the course
    const course = await Course.findOne({ _id: courseId, creator: teacherId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission' });
    }

    // Fetch the course request
    const courseRequest = await CourseRequest.findById(requestId);
    if (!courseRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update request status based on teacher's decision
    courseRequest.status = allow ? 'accepted' : 'rejected';
    await courseRequest.save();

    // If accepted, add student to the course
    if (allow) {
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { students: courseRequest.student }, // Prevent duplicates
      });
    }

    res.json({ message: `Request has been ${allow ? 'accepted' : 'rejected'}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
