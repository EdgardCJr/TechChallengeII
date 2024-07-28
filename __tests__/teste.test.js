const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Certifique-se de que o caminho está correto
const User = require('../models/user'); // Certifique-se de que o caminho está correto
const Post = require('../models/Post'); // Certifique-se de que o caminho está correto
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

let testPost;
let adminToken;
let userToken;

beforeAll(async () => {
  // Conexão com o banco de dados
  await mongoose.connect(process.env.MONGODB_URI);

  // Cria um usuário administrador
  const adminUser = new User({
    username: 'admin',
    password: 'admin123',
    role: 'professor',
  });
  const hashedPassword = await bcrypt.hash('admin123', 10);
  adminUser.password = hashedPassword;
  await adminUser.save();

  // Cria um usuário comum
  const user = new User({
    username: 'user',
    password: 'user123',
    role: 'aluno',
  });
  const hashedPasswordUser = await bcrypt.hash('user123', 10);
  user.password = hashedPasswordUser;
  await user.save();

  // Cria um post de teste
  testPost = new Post({
    title: 'Postagem teste',
    content: 'Esta é uma postagem teste.',
    author: 'Autor Teste',
  });
  await testPost.save();

  // Função para fazer login e obter o token
  const login = async (username, password) => {
    const response = await request(app)
      .post('/login')
      .send({ username, password });
    expect(response.status).toBe(200);
    return response.body.token;
  };

  // Obtenha tokens de autenticação
  adminToken = await login('admin', 'admin123');
  userToken = await login('user', 'user123');
});

afterAll(async () => {
  // Limpa os dados de teste
  await User.deleteMany({});
  await Post.deleteMany({});
  await mongoose.disconnect();
});

const authRequestTeacher = (method, url, data = {}) => {
  return request(app)
    [method](url)
    .set('Authorization', `Bearer ${adminToken}`)
    .send(data);
};

describe('Post Endpoints', () => {
  describe('GET /posts', () => {
    it('Devera retornar todos os posts', async () => {
      const response = await request(app).get('/posts');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.arrayContaining([
        expect.objectContaining({
          title: 'Postagem teste',
          content: 'Esta é uma postagem teste.',
          author: 'Autor Teste',
        }),
      ]));
    });
  });

  describe('GET /posts/admin', () => {
    it('Devera retornar a lista dos posts', async () => {
      const response = await authRequestTeacher('get', '/posts/admin');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.arrayContaining([
        expect.objectContaining({
          title: 'Postagem teste',
          content: 'Esta é uma postagem teste.',
          author: 'Autor Teste',
        }),
      ]));
    });
  });

  describe('DELETE /posts/:id', () => {
    it('Deve deletar o post especifico (autenticado como professor)', async () => {
      const response = await request(app)
        .delete(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.text).toBe('Post excluído com sucesso');
    });

    it('Deve retornar um erro 403 se o usuário não for professor', async () => {
      const response = await request(app)
        .delete(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(403);
    });

    it('Deve retornar um erro 401 se não estiver autenticado', async () => {
      const response = await request(app).delete(`/posts/${testPost._id}`);
      expect(response.status).toBe(401);
    });
  });
});
