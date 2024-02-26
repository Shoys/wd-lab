import supertest from 'supertest';

const request = supertest('http://localhost:3000');

// Helper to register a user and return their token
const registerUser = async (role) => {
    const username = `test-${Date.now()}-${Math.random()}`;
    const password = 'password';
    const userData = {
        username,
        password,
        role,
        name: `${role}-${username}`,
    };

    await request.post('/register').send(userData);
    const loginResponse = await request.post('/login').send({username, password});
    return loginResponse.body.token;
};

// Helper to create a course and return its ID
const createCourse = async (token) => {
    const courseData = {
        name: `Course-${Date.now()}-${Math.random()}`,
        description: 'Test course description',
    };

    const response = await request
        .post('/teacher/courses/create')
        .set('Authorization', `Bearer ${token}`)
        .send(courseData);

    return response.body._id; // Assuming the course creation response includes the course ID
};

describe('Course Request Endpoints', () => {
    let studentToken, anotherStudentToken, teacherToken, anotherTeacherToken, courseId;

    // Before each test, register a new student and teacher, and create a new course by the teacher
    beforeEach(async () => {
        studentToken = await registerUser('student');
        anotherStudentToken = await registerUser('student'); // For duplicate request test
        teacherToken = await registerUser('teacher');
        anotherTeacherToken = await registerUser('teacher'); // For unauthorized view test
        courseId = await createCourse(teacherToken);
    });


    it('Student successfully requests access to an existing course', async () => {
        const res = await request
            .post(`/student/courses/${courseId}/request`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send();

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('status', 'pending');
    });

    it('Teacher views all pending access requests for their course', async () => {
        // First, have a student request access to the course
        await request
            .post(`/student/courses/${courseId}/request`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send();

        // Then, have the teacher view pending requests
        const res = await request
            .get(`/teacher/courses/${courseId}/requests`)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send();

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('status', 'pending');
    });

    it('Teacher accepts a student\'s request to join their course', async () => {
        // First, have a student request access to the course
        const requestRes = await request
            .post(`/student/courses/${courseId}/request`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send();

        // Extract the request ID from the response
        const requestId = requestRes.body._id;

        // Then, have the teacher accept the request
        const res = await request
            .post(`/teacher/courses/${courseId}/requests/${requestId}`)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({allow: true});

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('accepted');
    });

    it('Student requests access with invalid course ID', async () => {
        const fakeCourseId = '123456789012345678901234'; // Assuming a 24-character hex string format for MongoDB ObjectIds
        const res = await request
            .post(`/student/courses/${fakeCourseId}/request`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send();

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('Course not found');
    });

    it('Student requests access to a course twice', async () => {
        // First request
        await request
            .post(`/student/courses/${courseId}/request`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send();

        // Duplicate request
        const res = await request
            .post(`/student/courses/${courseId}/request`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send();

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Request already exists');
    });

    it('Teacher tries to view requests for a course they don\'t own', async () => {
        // Have another student request access to the course
        await request
            .post(`/student/courses/${courseId}/request`)
            .set('Authorization', `Bearer ${anotherStudentToken}`)
            .send();

        // Attempt by another teacher to view the requests
        const res = await request
            .get(`/teacher/courses/${courseId}/requests`)
            .set('Authorization', `Bearer ${anotherTeacherToken}`)
            .send();

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('Course not found or you do not have permission');
    });

    it('Teacher tries to accept/reject request for a course they don\'t own', async () => {
        const requestId = '123456789012345678901234'; // Using a placeholder requestId for the example
        const res = await request
            .post(`/teacher/courses/${courseId}/requests/${requestId}`)
            .set('Authorization', `Bearer ${anotherTeacherToken}`)
            .send({ allow: true });

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('Course not found or you do not have permission');
    });

    it('Teacher accepts/rejects non-existing request', async () => {
        const fakeRequestId = '123456789012345678901234'; // Assuming a 24-character hex string format for MongoDB ObjectIds
        const res = await request
            .post(`/teacher/courses/${courseId}/requests/${fakeRequestId}`)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({ allow: true });

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('Request not found');
    });

    it('Teacher tries to view requests for a non-existing course', async () => {
        const fakeCourseId = '123456789012345678901234'; // Assuming a 24-character hex string format for MongoDB ObjectIds
        const res = await request
            .get(`/teacher/courses/${fakeCourseId}/requests`)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send();

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('Course not found or you do not have permission');
    });

    it('Unauthorized user tries to make a course request', async () => {
        const res = await request
            .post(`/student/courses/${courseId}/request`)
            .send(); // No Authorization header

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toContain('Not authorized');
    });

    it('Unauthorized user tries to view course requests', async () => {
        const res = await request
            .get(`/teacher/courses/${courseId}/requests`)
            .send(); // No Authorization header

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toContain('Not authorized');
    });

    it('Unauthorized user tries to respond to a course request', async () => {
        const requestId = '123456789012345678901234'; // Using a placeholder requestId for the example
        const res = await request
            .post(`/teacher/courses/${courseId}/requests/${requestId}`)
            .send({ allow: true }); // No Authorization header

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toContain('Not authorized');
    });

    it('Student tries to request access without being authenticated', async () => {
        const res = await request
            .post(`/student/courses/${courseId}/request`)
            .send(); // No Authorization header

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toContain('Not authorized');
    });

    it('Teacher tries to respond to a request without being authenticated', async () => {
        const fakeRequestId = '123456789012345678901234'; // Using a placeholder requestId for the example
        const res = await request
            .post(`/teacher/courses/${courseId}/requests/${fakeRequestId}`)
            .send({ allow: true }); // No Authorization header

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toContain('Not authorized');
    });
})
