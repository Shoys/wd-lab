import supertest from 'supertest';
const request = supertest('http://localhost:3000');

describe('Authentication System', () => {
  it('should register a new user', async () => {
    const res = await request.post('/register').send({
      username: randomUsername(),
      password: 'password123',
      role: 'student',
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login the user', async () => {
    const username = randomUsername()
    await request.post('/register').send({
      username,
      password: 'password123',
      role: 'student',
    });

    const res = await request.post('/login').send({
      username,
      password: 'password123',
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not register a user with an existing username', async () => {
      const username = randomUsername()
      await request.post('/register').send({
      username,
      password: 'password123',
      role: 'student',
    });

    const res = await request.post('/register').send({
      username,
      password: 'newpassword123',
      role: 'teacher',
    });

    expect(res.statusCode).toEqual(400);
  });

  it('should not login with incorrect password', async () => {
    const username = randomUsername()
    await request.post('/register').send({
      username,
      password: 'password123',
      role: 'student',
    });
    const res = await request.post('/login').send({
      username: 'loginuser',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toEqual(401);
  });
});

function randomUsername() {
  return `test-${Date.now()}-${Math.random()}`
}
