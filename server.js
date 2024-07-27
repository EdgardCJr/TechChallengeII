require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const mongoose = require('mongoose');
const Post = require('./models/Post');
const app = express();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB', err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// Função para validar dados do formulário
function validateFormData(req, res) {
  const { title, content, author } = req.body;
  if (!title || !content || !author) {
    return res.status(400).send('Por favor, preencha todos os campos.');
  }
  return true;
}

// Função para lidar com erros comuns
function handleError(err, res) {
  console.error('Error:', err);
  res.status(500).send('Erro ao processar a requisição');
}

// Endpoints REST
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    handleError(err, res);
  }
});

app.get('/posts/admin', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    handleError(err, res);
  }
});

app.get('/posts/search', async (req, res) => {
  try {
    const { q } = req.query;
    const posts = await Post.find({
      $or: [
        { title: new RegExp(q, 'i') },
        { content: new RegExp(q, 'i') },
      ],
    });
    res.json(posts);
  } catch (err) {
    handleError(err, res);
  }
});

app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post não encontrado');
    res.json(post);
  } catch (err) {
    handleError(err, res);
  }
});

app.post('/posts', async (req, res) => {
  if (!validateFormData(req, res)) return;
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    handleError(err, res);
  }
});

app.put('/posts/:id', async (req, res) => {
  if (!validateFormData(req, res)) return;
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).send('Post não encontrado');
    res.json(post);
  } catch (err) {
    handleError(err, res);
  }
});


app.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).send('Post não encontrado');
    res.send('Post excluído com sucesso');
  } catch (err) {
    handleError(err, res);
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});