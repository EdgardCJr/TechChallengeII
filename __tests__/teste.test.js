const request = require('supertest');
const app = require('./server');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.JWT_SECRET = 'test-secret';

// Connect to the test database before each test
beforeEach(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Disconnect from the test database after each test
afterEach(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Registro de Usuário', () => {
  it('deve registrar um novo usuário com sucesso', async () => {
    const username = 'testuser';
    const password = 'testpassword';
    const role = 'aluno';

    const res = await request(app)
      .post('/register')
      .send({ username, password, role });

    expect(res.status).toBe(201);
    expect(res.text).toBe('Usuário registrado com sucesso.');

    const user = await User.findOne({ username });
    expect(user).toBeDefined();
    expect(user.username).toBe(username);
    expect(await bcrypt.compare(password, user.password)).toBe(true);
    expect(user.role).toBe(role);
  });

  it('deve retornar 400 se o nome de usuário já existir', async () => {
    const username = 'testuser';
    const password = 'testpassword';
    const role = 'aluno';

    await User.create({ username, password, role });

    const res = await request(app)
      .post('/register')
      .send({ username, password, role });

    expect(res.status).toBe(400);
    expect(res.text).toBe('Nome de usuário já existe.');
  });
});

describe('Autenticação', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'testpassword',
      role: 'aluno',
    });
    userId = user._id;

    const payload = { id: userId, role: 'aluno' };
    token = jwt.sign(payload, process.env.JWT_SECRET);
  });

  it('deve autenticar um usuário com sucesso', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpassword' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('deve retornar 401 se as credenciais forem inválidas', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.text).toBe('Credenciais inválidas');
  });
});

describe('Endpoints de Postagem', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'testpassword',
      role: 'aluno',
    });
    userId = user._id;

    const payload = { id: userId, role: 'aluno' };
    token = jwt.sign(payload, process.env.JWT_SECRET);
  });

  describe('GET /posts', () => {
    it('deve retornar uma lista de postagens', async () => {
      await Post.create({
        title: 'Postagem de Teste 1',
        content: 'Esta é uma postagem de teste.',
        author: 'testuser',
      });
      await Post.create({
        title: 'Postagem de Teste 2',
        content: 'Outra postagem de teste.',
        author: 'testuser',
      });

      const res = await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /posts/admin', () => {
    it('deve retornar uma lista de postagens apenas para professores', async () => {
      await Post.create({
        title: 'Postagem de Teste 1',
        content: 'Esta é uma postagem de teste.',
        author: 'testuser',
      });
      await Post.create({
        title: 'Postagem de Teste 2',
        content: 'Outra postagem de teste.',
        author: 'testuser',
      });

      const teacherToken = jwt.sign({ id: userId, role: 'professor' }, process.env.JWT_SECRET);

      const res = await request(app)
        .get('/posts/admin')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('deve retornar 403 para usuários que não são professores', async () => {
      const res = await request(app)
        .get('/posts/admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.text).toBe('Proibido: Somente professores podem acessar.');
    });
  });

  describe('GET /posts/search', () => {
    it('deve retornar postagens que correspondem à consulta de pesquisa', async () => {
      await Post.create({
        title: 'Postagem de Teste 1',
        content: 'Esta é uma postagem de teste.',
        author: 'testuser',
      });
      await Post.create({
        title: 'Outra Postagem de Teste',
        content: 'Esta é outra postagem de teste.',
        author: 'testuser',
      });

      const res = await request(app)
        .get('/posts/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ q: 'teste' });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /posts/:id', () => {
    it('deve retornar uma postagem específica', async () => {
      const post = await Post.create({
        title: 'Postagem de Teste',
        content: 'Esta é uma postagem de teste.',
        author: 'testuser',
      });

      const res = await request(app)
        .get(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Postagem de Teste');
    });

    it('deve retornar 404 se a postagem não for encontrada', async () => {
      const res = await request(app)
        .get('/posts/1234567890')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.text).toBe('Postagem não encontrada');
    });
  });

  describe('POST /posts', () => {
    it('deve criar uma nova postagem', async () => {
      const newPost = {
        title: 'Nova Postagem de Teste',
        content: 'Esta é uma nova postagem de teste.',
        author: 'testuser',
      };

      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(newPost);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(newPost.title);
      expect(res.body.content).toBe(newPost.content);
      expect(res.body.author).toBe(newPost.author);
    });

    it('deve retornar 400 se os dados do formulário forem inválidos', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Esta é uma postagem de teste.' });

      expect(res.status).toBe(400);
      expect(res.text).toBe('Por favor, preencha todos os campos.');
    });
  });

  describe('PUT /posts/:id', () => {
    it('deve atualizar uma postagem existente', async () => {
      const post = await Post.create({
        title: 'Postagem de Teste',
        content: 'Esta é uma postagem de teste.',
        author: 'testuser',
      });

      const updatedPost = {
        title: 'Postagem de Teste Atualizada',
        content: 'Esta é uma postagem de teste atualizada.',
        author: 'testuser',
      };

      const res = await request(app)
        .put(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedPost);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe(updatedPost.title);
      expect(res.body.content).toBe(updatedPost.content);
    });

    it('deve retornar 404 se a postagem não for encontrada', async () => {
      const res = await request(app)
        .put('/posts/1234567890')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Postagem de Teste Atualizada', content: 'Esta é uma postagem de teste atualizada.' });

      expect(res.status).toBe(404);
      expect(res.text).toBe('Postagem não encontrada');
    });

    it('deve retornar 400 se os dados do formulário forem inválidos', async () => {
      const post = await Post.create({
        title: 'Postagem de Teste',
        content: 'Esta é uma postagem de teste.',
        author: 'testuser',
      });

      const res = await request(app)
        .put(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Esta é uma postagem de teste atualizada.' });

      expect(res.status).toBe(400);
      expect(res.text).toBe('Por favor, preencha todos os campos.');
    });
  });

  describe('DELETE /posts/:id', () => {
    it('deve excluir uma postagem existente', async () => {
      const post = await Post.create({
        title: 'Postagem de Teste',
        content: 'Esta é uma postagem de teste.',
        author: 'testuser',
      });

      const res = await request(app)
        .delete(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.text).toBe('Postagem excluída com sucesso');

      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();
    });

    it('deve retornar 404 se a postagem não for encontrada', async () => {
      const res = await request(app)
        .delete('/posts/1234567890')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.text).toBe('Postagem não encontrada');
    });
  });
});
