const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');



// Função de middleware para verificar se o usuário está logado
function checkAuth(req, res, next) {
  if (req.session.userId) {
      next(); 
  } else {
      res.redirect('/login'); 
  }
}

const checkAdminLevel = (req, res, next) => {
  // Verifica se o usuário está logado
  if (!req.session.userId) {
      return res.redirect('/login'); 
  }  


  // Verifica se o nível do usuário é 2
  if (req.session.nivel === '2') {
    console.log('Nível do usuário:', req.session.nivel);
      return next(); 
      
      
  } else {
      return res.status(403).send('Acesso negado: você não tem permissão para acessar esta página.'); // Acesso negado
  }

  
};



const { Usuario, Telefone, Endereco, Eletronico,
       ImagensObjeto, Veiculo, Objeto} = require('../models');
const path = require('path'); // Importando o módulo path

const { cadastrarUsuario, listarUsuarios, excluirUsuario, listarObjetosUsuario, 
  excluirObjeto, editarNivelPermissao, cadastrarObjeto, loginController, 
  logoutController, editarObjeto, getDashboard, listarObjetosTodos, viewObjeto, buscarObjetosPorCategoria,
  buscarObjetosPorStatus, CarregarDadosUsuario, buscarUsuario, carregarDadosUsuarioParaEdicao, 
  atualizarUsuario, gerenciarObjetos, buscarObjetos, excluirImagem, listarAuditorias,  
  filtrarAuditorias} = require('../controllers/recupcontroller'); 

router.post('/cadastro', cadastrarUsuario); 
router.get('/gerenciarusuario', checkAdminLevel, listarUsuarios); 
router.delete('/usuario/:id', excluirUsuario);
router.post('/editarNivel/:id', editarNivelPermissao);
router.post('/login', loginController);
router.get('/logout', logoutController)
router.post('/excluirObjeto/:id', excluirObjeto);
router.get('/home', listarObjetosTodos);
router.get('/dashboard', getDashboard);
router.get('/viewObjetos/:id', viewObjeto);
router.get('/meusdados', CarregarDadosUsuario);
router.get('/editarusuario/:id', carregarDadosUsuarioParaEdicao);
router.post('/editarusuario/:id', atualizarUsuario);
router.get('/gerenciarobjeto', checkAdminLevel, gerenciarObjetos);
router.get('/buscar', buscarObjetos);
router.delete('/excluirImagem/:id', excluirImagem);
router.get('/auditorias', checkAdminLevel, listarAuditorias, filtrarAuditorias);




router.get('/meusobjetos', checkAuth, async (req, res) => {
  try {
    const objetos = await Objeto.findAll({
      where: { id_usuario: req.session.userId }, 
      include: [{ model: ImagensObjeto, as: 'imagens' }]
    });
    
    const usuario = await Usuario.findByPk(req.session.userId);

    return res.render('meusobjetos', { 
      objetos, 
      nomeUsuario: usuario ? usuario.nome : null 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Erro ao listar objetos');
  }
});


// Rota para exibir o formulário de edição do usuário, lógica no controller
router.get('/editarNivel/:id', async (req, res) => {
  try {

      const usuario = await Usuario.findByPk(req.params.id);

      if (!usuario) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Renderizar a view do formulário de edição, passando os dados do usuário
      res.render('formularios/editarNivel', { 
          usuario: usuario.get({ plain: true }), 
          layout: 'formularios',
          title: 'editarNivel'
      });
  } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});



// Rota para a página inicial
router.get('/', (req, res) => {
  if (req.session.userId) {
    console.log('Sessão:', req.session); 
    return res.render('home', {
        nomeUsuario: req.session.nomeUsuario,
        nivel: req.session.nivel
    });
  } else {
    return res.redirect('/home');
  }
});


// Rota para a página de login
router.get('/login', (req, res) => {
  res.render('formularios/login', {
    layout: 'formularios', 
    title: 'Login' 
  });
});


router.get('/editarusuario/:id', (req, res) => {
  res.render('formularios/editarusuario', {
    layout: 'formularios', 
    title: 'editarusuario' 
  });
});


// Rota para a página de cadastro
router.get('/cadastro', (req, res) => {
  res.render('formularios/cadastro', {
    layout: 'formularios',
    title: 'Cadastro'
  });
});

router.get('/postar', checkAuth, async (req, res) => {
  try {
      // Recupera o usuário logado usando o ID armazenado na sessão
      const usuario = await Usuario.findByPk(req.session.userId);

      if (!usuario) {
          return res.redirect('/login'); 
      }

      // Envia o nome do usuário para a view, além de outras informações, se necessário
      res.render('formularios/postar', {
          layout: 'formularios', 
          title: 'Postar',
          nomeUsuario: usuario.nome 
      });
  } catch (error) {
      console.error('Erro ao carregar a página de postagem:', error);
      res.status(500).send('Erro no servidor.');
  }
});




router.get('/ajuda', (req, res) => {
  res.render('ajuda');
});


router.get('/artigos', (req, res) => {
  res.render('ajuda/artigos/artigos');
});

router.get('/direitos', (req, res) => {
  res.render('ajuda/artigos/direitos');
});

router.get('/furtoroubo', (req, res) => {
  res.render('ajuda/artigos/furtoroubo');
  
});

router.get('/gerenciarobjeto', checkAdminLevel, (req, res) => {
  res.render('gerenciarobjeto');
});



router.get('/contato', (req, res) => {
  res.render('contato');
});

router.get('/comodenunciar', (req, res) => {
  res.render('ajuda/comodenunciar');
});

router.get('/dicasregionais', (req, res) => {
  res.render('ajuda/dicasregionais');
});

router.get('/links', (req, res) => {
  res.render('ajuda/links', );
});

router.get('/editarImagens', (req, res) => {
  res.render('editarImagens', );
});



router.get('/admincadObjeto', (req, res) => {
  res.render('formularios/admincadObjeto',{    
    layout: 'formularios', 
    title: 'Cadastrar Objeto' 
  });
  });


router.get('/admincadUsuario', (req, res) => {
  res.render('formularios/admincadUsuario', {
    layout: 'formularios', 
    title: 'Cadastrar Usuário' 
  });
});



//============================================================

// Atualizar usuarios
router.post('/usuario/:id', async (req, res) => {
  const userId = req.params.id; 
  const { permission_level } = req.body; 

  try {
      // Atualiza o nível de permissão no banco de dados
      await Usuario.update(
          { nivel: permission_level },
          { where: { id: userId } }
      );

      // Redireciona para a página de gerenciar usuários após a atualização
      res.redirect('/gerenciarusuario');
  } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao atualizar o usuário');
  }
});


//============================================================

const multer = require('multer');

// Configura o armazenamento e o nome do arquivo

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/img/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Rota para postar objeto com upload de imagens
router.post('/postar', upload.array('images', 10), cadastrarObjeto);

// Rota para editar objeto com upload de imagens
router.post('/editarobjeto/:id', upload.array('images', 10), editarObjeto);

//============================================================
// carregar os dados do o objeto para edição
//============================================================

router.get('/editarobjeto/:id', async (req, res) => {
  try {
      // Buscando o objeto sem associações
      const objeto = await Objeto.findByPk(req.params.id);
      console.log('Objeto encontrado:', objeto);

      if (!objeto) {
          return res.status(404).json({ error: 'Objeto não encontrado.' });
      }

      // Variáveis para armazenar dados adicionais
      let eletronico = null;
      let veiculo = null;
      let imagens = [];

      // Verifique o valor de `categoria`
      console.log('Categoria do objeto:', objeto.categoria);

      // Carregar dados adicionais apenas se a categoria for "eletronico" ou "veiculo"
      if (objeto.categoria === 'eletronico') {
          console.log('ID do Objeto para Eletronico:', objeto.id);
          // Garantir que a busca não falhe, mesmo se não houver registros
          eletronico = await Eletronico.findOne({ where: { id_objeto: objeto.id } });
          console.log('Dados de Eletronico após busca:', eletronico || 'Nenhum dado de eletrônico encontrado');
      } else if (objeto.categoria === 'veiculo') {
          veiculo = await Veiculo.findOne({ where: { id_objeto: objeto.id } });
          console.log('Dados de Veiculo:', veiculo || 'Nenhum dado de veículo encontrado');
      }

      // Buscar todas as imagens associadas ao objeto
      imagens = await ImagensObjeto.findAll({ where: { id_objeto: objeto.id } });
      console.log('Imagens associadas ao objeto:', imagens.length > 0 ? imagens : 'Nenhuma imagem encontrada');

      // Renderizar o formulário de edição com os dados do objeto e das associações, se existirem
      res.render('formularios/editarobjeto', {
          objeto,
          eletronico,
          veiculo,
          imagens,
          layout: 'formularios'
      });
  } catch (error) {
      console.error('Erro ao carregar o objeto:', error);
      res.status(500).json({ error: 'Erro ao carregar o objeto.' });
  }
});




//=================================================
//    filtro por categoria
//=================================================

router.get('/filtro', async (req, res) => {
  const categoria = req.query.filtro || 'todos'; 
  try {
      const objetos = await buscarObjetosPorCategoria(categoria);
      res.render('home', { objetos, selectedFiltro: categoria }); 
  } catch (error) {
      console.error('Erro ao buscar objetos filtrados:', error);
      res.status(500).send('Erro ao buscar objetos.');
  }
});


//============================================================
//                      filtro por status
//============================================================
router.get('/filtro-status', async (req, res) => {
  const { status } = req.query;
  const usuarioId = req.session.userId; // Acessando o ID do usuário da sessão

  if (!usuarioId) {
      return res.status(401).send('Usuário não autenticado');
  }

  try {
      const objetos = await buscarObjetosPorStatus(status, usuarioId);
      res.render('meusobjetos', { objetos, selectedStatus: status });
  } catch (error) {
      console.error('Erro ao buscar objetos filtrados:', error);
      res.status(500).send('Erro ao buscar objetos.');
  }
});


//=======================










module.exports = router;
