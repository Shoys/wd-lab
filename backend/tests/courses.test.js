import supertest from 'supertest';

const request = supertest('http://localhost:3000');

function randomUsername() {
    return `test-${Date.now()}-${Math.random()}`;
}

describe('Course Service API', () => {
    let teacherToken, studentToken, teacherId, studentId, courseId;

    // Register and login a teacher and a student before running tests
    beforeAll(async () => {
        const teacherUsername = randomUsername();
        // Register a teacher
        await request.post('/register').send({
            username: teacherUsername,
            password: 'password',
            role: 'teacher',
        });

        // Login the teacher
        const teacherLogin = await request.post('/login').send({
            username: teacherUsername,
            password: 'password',
        });
        teacherToken = teacherLogin.body.token;
        teacherId = teacherLogin.body._id;

        // Register a student
        const studentUsername = randomUsername();
        await request.post('/register').send({
            username: studentUsername,
            password: 'password',
            role: 'student',
        });

        // Login the student
        const studentLogin = await request.post('/login').send({
            username: studentUsername,
            password: 'password',
        });
        studentToken = studentLogin.body.token;
        studentId = studentLogin.body._id;

        // Create a course for the teacher to use in the tests, and test the creation
        const response = await request.post('/teacher/courses/create')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({name: 'New Course', description: 'A test course by teacher'});
        expect(response.statusCode).toEqual(201);
        courseId = response.body._id;
    });

    // Error scenario: Attempt to create a course without authentication
    it('Create a course without token (Error)', async () => {
        const response = await request.post('/teacher/courses/create')
            .send({name: 'Unauthorized Course', description: 'Should fail'});
        expect(response.statusCode).toEqual(401);
    });

    // Error scenario: Attempt to create a course without being a teacher
    it('Create a course as a student (Error)', async () => {
        const response = await request.post('/teacher/courses/create')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({name: 'Unauthorized Course', description: 'Should fail'});
        expect(response.statusCode).toEqual(403);
    });

    // Error scenario: Attempt to get course details without being added to the course
    it('Access course details without access (Error)', async () => {
        const response = await request.get(`/student/courses/${courseId}`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(response.statusCode).toEqual(403);
    });

    // Test for getting course details as a student (success scenario)
    it('Get course details as a student (Student)', async () => {
        // First, add the student to the course (assuming this endpoint works as intended)
        const responsePre = await request.post(`/teacher/courses/${courseId}/add-student`)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({userId: studentId});
        expect(responsePre.statusCode).toEqual(200);

        const response = await request.get(`/student/courses/${courseId}`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(response.statusCode).toEqual(200);
    });

    // Error scenario: Attempt to get course details of a non-existent course
    it('Get details of a non-existent course (Error)', async () => {
        const response = await request.get('/student/courses/invalidCourseId')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(response.statusCode).toEqual(404);
    });

    // Test for editing a course by the teacher
    it('Edit a course (Teacher)', async () => {
        const response = await request.post(`/teacher/courses/edit/${courseId}`)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({name: 'Updated Course Name', description: 'Updated description'});
        expect(response.statusCode).toEqual(200);
        expect(response.body.name).toEqual('Updated Course Name');
    });

    // Error scenario: Attempt to edit a course by a non-creator teacher
    it('Edit a course by non-creator (Error)', async () => {
        // Register another teacher
        const anotherTeacherUsername = randomUsername();
        await request.post('/register').send({
            username: anotherTeacherUsername,
            password: 'password',
            role: 'teacher',
        });

        // Login the new teacher
        const anotherTeacherLogin = await request.post('/login').send({
            username: anotherTeacherUsername,
            password: 'password',
        });
        const anotherTeacherToken = anotherTeacherLogin.body.token;

        const response = await request.post(`/teacher/courses/edit/${courseId}`)
            .set('Authorization', `Bearer ${anotherTeacherToken}`)
            .send({name: 'Illegally Updated Course Name', description: 'Should fail'});
        expect(response.statusCode).toEqual(403);
    });

    // Test for deleting a course by the teacher
    it('Delete a course (Teacher)', async () => {
        const response = await request.delete(`/teacher/courses/delete/${courseId}`)
            .set('Authorization', `Bearer ${teacherToken}`);
        expect(response.statusCode).toEqual(204);
    });

    // Error scenario: Attempt to delete a course without authentication
    it('Delete a course without token (Error)', async () => {
        const response = await request.delete(`/teacher/courses/delete/${courseId}`);
        expect(response.statusCode).toEqual(401);
    });

    // Error scenario: Attempt to delete a course by a non-creator teacher
    it('Delete a course by non-creator (Error)', async () => {
        // Register another teacher
        const anotherTeacherUsername = randomUsername();
        await request.post('/register').send({
            username: anotherTeacherUsername,
            password: 'password',
            role: 'teacher',
        });

        // Login the new teacher
        const anotherTeacherLogin = await request.post('/login').send({
            username: anotherTeacherUsername,
            password: 'password',
        });
        const anotherTeacherToken = anotherTeacherLogin.body.token;

        const response = await request.delete(`/teacher/courses/delete/${courseId}`)
            .set('Authorization', `Bearer ${anotherTeacherToken}`);
        expect(response.statusCode).toEqual(403);
    });

    // Test for listing courses a student is enrolled in
    it('List enrolled courses (Student)', async () => {
        // Ensure the student is enrolled in at least one course before this test
        const response = await request.get('/student/courses/my')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(response.statusCode).toEqual(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        // Further checks can be added to validate the contents of the response
    });

    // Error scenario: Student tries to list courses without being enrolled in any
    it('List courses without enrollment (Error)', async () => {
        // Ensure the student is not enrolled in any courses before this test
        const response = await request.get('/student/courses/my')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(response.statusCode).toEqual(200); // Still OK, but the list should be empty
        expect(response.body).toHaveLength(0);
    });
});
