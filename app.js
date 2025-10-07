const express = require('express');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./models');

app.use(session({
    secret: 'seuSegredo',
    store: new SequelizeStore({
        db: sequelize,
    }),
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        maxAge: 1000 * 60 * 60 // 1 hora
    }
}));


const routes = require('./routes/index'); 
const db = require('./config/database');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const { engine } = require('express-handlebars');
const { Usuario } = require('./models');
require('dotenv').config();





const app = express();


 

app.use('/uploads', express.static('public/img/uploads'));



app.use(express.urlencoded({ extended: true })); // Para dados de formulários
app.use(express.json()); // Para JSON

// Definindo o helper eq
Handlebars.registerHelper('eq', function (a, b) {
  return a === b, a && b;
});

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('getFileName', function (path) {
  return path.split('/').pop();
})




// Configuração do middleware express-session
app.use(session({
  secret: 'R$#vn8x*2G6z7@X5&8b94NdMswP1Q', 
  resave: false,            // Evita resalvar a sessão se ela não foi modificada
  saveUninitialized: false, // Evita salvar sessões não inicializadas
  cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));

app.use(express.urlencoded({ extended: true }));

// Middleware para manipular requisições
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Configurar Handlebars como view engine
app.engine('handlebars', engine({ // Corrigido aqui
  defaultLayout: 'main',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));




//recupera o nome do usuário para exibir no head
app.use(async (req, res, next) => {
  if (req.session.userId) {
      const usuario = await Usuario.findByPk(req.session.userId);
      if (usuario) {
          res.locals.nomeUsuario = usuario.nome; // Armazena o nome do usuário em res.locals
      }
  }
  next();
});


// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('_method'));
// Rotas
app.use('/', routes);



// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Rota de teste para home
app.get('/', (req, res) => {
  res.render('home', { activePage: 'home' });
});

// Rota para Meus Objetos
app.get('/meusobjetos', (req, res) => {
  res.render('meusobjetos', { activePage: 'meusobjetos' });
});



// Middleware para logar todas as requisições
app.use((req, res, next) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  next();
});


//==============================================

// Função para registrar ações no log de auditoria
const logAudit = async (userId, actionType, details, result) => {
  await db.query('INSERT INTO audit_log (user_id, action_type, details, result) VALUES (?, ?, ?, ?)', [userId, actionType, details, result]);
};

// Rota para adicionar um novo registro
app.post('/add-record', async (req, res) => {
  const userId = req.body.userId; // ID do usuário que está fazendo a ação
  const recordDetails = req.body.details; // Detalhes do registro a ser adicionado

  try {
      // Lógica para adicionar o registro ao banco de dados
      await db.query('INSERT INTO records (details) VALUES (?)', [recordDetails]);

      // Registrar no log de auditoria
      await logAudit(userId, 'inclusão', `Adicionado registro: ${recordDetails}`, 'sucesso');
      res.status(201).send('Registro adicionado com sucesso.');
  } catch (error) {
      // Registrar falha no log de auditoria
      await logAudit(userId, 'inclusão', `Falha ao adicionar registro: ${recordDetails}`, 'falha');
      res.status(500).send('Erro ao adicionar registro.');
  }
});

