import supertest from 'supertest';
const request = supertest('http://localhost:3000');

describe('Public Endpoints', () => {
  it('should list all courses', async () => {
    const res = await request.get('/courses');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should get a user profile', async () => {
    const username = randomUsername()
    const loginRes = await request.post('/register').send({
      username,
      password: 'password123',
      role: 'teacher'
    });

    const userId = loginRes.body._id; // or extract userId appropriately
    const res = await request.get(`/profile?user=${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('username', username);
  });

  it('should return an error for a non-existent user profile', async () => {
    const res = await request.get(`/profile?user=${randomUsername()}`);
    expect(res.statusCode).toEqual(404);
  });
});

function randomUsername() {
  return `test-${Date.now()}-${Math.random()}`
}
