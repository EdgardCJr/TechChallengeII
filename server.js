require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const jwt = require('jsonwebtoken');
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

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).send('Unauthorized');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Forbidden');
    req.user = user; // Attach user information to the request
    next();
  });
};

// Middleware de autorização para professores
const authorizeTeacher = (req, res, next) => {
  if (req.user.role !== 'professor') {
    return res.status(403).send('Forbidden: Somente professore podem acessar.');
  }
  next();
};

app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    console.log('Recebido:', { username, password, role }); // Log para verificar os dados recebidos

    const user = await User.findOne({ username });
    if (!user) {
      console.log('Usuário não encontrado');
      return res.status(401).send('Credenciais inválidas');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Senha incorreta');
      return res.status(401).send('Credenciais inválidas');
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET); //{ expiresIn: '1h' }
    console.log('Token gerado:', token); 

    res.send({ token });
  } catch (err) {
    console.error('Erro no servidor:', err); // Log do erro
    res.status(500).send('Erro no servidor');
  }
});

// Endpoint para registrar um novo usuário
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists.');
    }

    // Crie o novo usuário
    const newUser = new User({
      username,
      password,
      role,
    });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    newUser.password = hashedPassword;

    await newUser.save();
    res.status(201).send('User registered successfully.');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user.');
  }
});

// Endpoints REST
app.get('/posts',authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    handleError(err, res);
  }
});

app.get('/posts/admin',authenticateToken, authorizeTeacher, async (req, res) => { 
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    handleError(err, res);
  }
});

app.get('/posts/search',authenticateToken, async (req, res) => {
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

app.get('/posts/:id',authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post não encontrado');
    res.json(post);
  } catch (err) {
    handleError(err, res);
  }
});

app.post('/posts',authenticateToken, async (req, res) => {
  if (!validateFormData(req, res)) return;
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    handleError(err, res);
  }
});

app.put('/posts/:id',authenticateToken, async (req, res) => {
  if (!validateFormData(req, res)) return;
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).send('Post não encontrado');
    res.json(post);
  } catch (err) {
    handleError(err, res);
  }
});


app.delete('/posts/:id',authenticateToken, async (req, res) => {
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

module.exports = app;
