// controllers/userController.js
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Telefone = require('../models/Telefone');
const Endereco = require('../models/Endereco');
const Auditoria = require('../models/Auditoria');
const path = require('path');
const { Op } = require('sequelize');

const { Objeto, Eletronico, Veiculo,  ImagensObjeto} = require('../models'); 


//==========================================
//      auditoria de registros
//==========================================

async function registrarAuditoria(id_usuario, tipo_acao, detalhes, resultado) {
    try {
        await Auditoria.create({
            id_usuario,
            tipo_acao,
            detalhes,
            resultado,
        });
        console.log('Registro de auditoria salvo com sucesso.');
    } catch (error) {
        console.error('Erro ao salvar registro de auditoria:', error);
    }
}


//============================================================
//              cadastro de usuÃ¡rio
//============================================================


const cadastrarUsuario = async (req, res) => {
    try {
        const { username, cpf, email, password, confirm_password, gender, birthdate, phone1, phone1_type, phone2, phone2_type, state, city, neighborhood, street, number, cep, permission_level, status } = req.body;

        if (password !== confirm_password) {
            return res.send(`
                <script>
                    alert('As senhas nÃ£o coincidem. Por favor, tente novamente.');
                    window.history.back();
                </script>
            `);
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Senha criptografada durante o cadastro:", hashedPassword);
        
        const usuarioStatus = status || 'Ativo';


        // Inserir o usuÃ¡rio na tabela USUARIO
        const usuario = await Usuario.create({
            nome: username,
            cpf: cpf,
            email: email,
            senha: hashedPassword,
            sexo: gender,
            data_nascimento: birthdate,
            nivel: permission_level,
            status: usuarioStatus // Define o status como 'ativo' automaticamente
        });

        // Inserir os telefones na tabela TELEFONE
        if (phone1) {
            await Telefone.create({
                id_usuario: usuario.id,
                tipo: phone1_type || 'telefone',
                numero: phone1
            });
        }

        if (phone2) {
            await Telefone.create({
                id_usuario: usuario.id,
                tipo: phone2_type || 'telefone',
                numero: phone2
            });
        }

        // Inserir o endereÃ§o na tabela ENDERECO
        await Endereco.create({
            id_usuario: usuario.id,
            numero: number,
            cidade: city,
            bairro: neighborhood,
            cep: cep,
            rua: street,
            estado: state
        });

    // Responder com uma mensagem de alerta e redirecionar para a pÃ¡gina de login

    const nivel = req.session.nivel;
    if (nivel === '2') {
        res.send(`
            <script>
                alert('UsuÃ¡rio cadastrado com sucesso');
                window.location.href = '/gerenciarusuario';
            </script>
        `);
    } else {
        res.send(`
            <script>
                alert('UsuÃ¡rio cadastrado com sucesso');
                window.location.href = '/login';
            </script>
        `);
    }
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cadastrar usuÃ¡rio' });
}
};

//============================================================
//                     dashboard (visão geral)
//============================================================

const moment = require('moment'); 

const getDashboard = async (req, res) => {
    try {
        // Filtros opcionais
        const { status, categoria, periodo } = req.query;

        const where = {};
        if (status && status !== 'todos') {
            where.status = status; // valores esperados: 'Roubado', 'Furtado', 'Recuperado'
        }
        if (categoria && categoria !== 'todas') {
            where.categoria = categoria; // valores: 'eletronico', 'veiculo', 'outro'
        }

        const [totalObjetos, totalRecuperados] = await Promise.all([
            Objeto.count({ where }),
            Objeto.count({ where: { ...where, status: 'Recuperado' } })
        ]);

        const emAndamento = await Objeto.count({
            where: { ...where, status: { [Op.ne]: 'Recuperado' } }
        });

        const taxaRecuperacao = totalObjetos > 0 ? Math.round((totalRecuperados / totalObjetos) * 100) : 0;

        // Últimos 10 objetos recentes (proxy por ID desc)
        const recentes = await Objeto.findAll({
            where,
            order: [['id', 'DESC']],
            limit: 10,
            include: [
                { model: ImagensObjeto, as: 'imagens' },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }
            ]
        });

        // Mapear endereços dos usuários para localização aproximada
        const usuarioIds = [...new Set(recentes.map(o => o.usuario ? o.usuario.id : null).filter(Boolean))];
        let enderecosPorUsuario = {};
        if (usuarioIds.length > 0) {
            const enderecos = await Endereco.findAll({ where: { id_usuario: usuarioIds } });
            enderecos.forEach(e => {
                if (!enderecosPorUsuario[e.id_usuario]) enderecosPorUsuario[e.id_usuario] = [];
                enderecosPorUsuario[e.id_usuario].push(e);
            });
        }

        const objetosRecentes = recentes.map(o => {
            const endereco = o.usuario ? (enderecosPorUsuario[o.usuario.id] ? enderecosPorUsuario[o.usuario.id][0] : null) : null;
            return {
                id: o.id,
                recompensa: o.recompensa,
                crime: o.crime,
                cor: o.cor,
                status: o.status,
                categoria: o.categoria,
                usuario: o.usuario ? o.usuario.nome : '—',
                cidade: endereco ? endereco.cidade : null,
                bairro: endereco ? endereco.bairro : null,
                rua: endereco ? endereco.rua : null,
                img: (o.imagens && o.imagens[0]) ? o.imagens[0].img1 : null
            };
        });

        // Tendência mensal (placeholder até termos data de criação)
        // Como os modelos não possuem timestamps, preenchemos com zeros
        // e rótulos dos últimos 12 meses. Quando houver auditoria de cadastro
        // poderemos substituir por contagem real.
        const labels = [];
        const dadosMensais = [];
        for (let i = 11; i >= 0; i--) {
            const m = moment().subtract(i, 'months');
            labels.push(m.format('MMM/YYYY'));
            dadosMensais.push(0);
        }

        res.render('dashboard', {
            layout: 'main',
            stats: {
                totalObjetos,
                totalRecuperados,
                emAndamento,
                taxaRecuperacao
            },
            chart: {
                labels,
                values: dadosMensais
            },
            objetosRecentes,
            filtros: {
                status: status || 'todos',
                categoria: categoria || 'todas',
                periodo: periodo || 'todos'
            }
        });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        res.status(500).render('error', { message: 'Erro ao carregar dashboard.' });
    }
};

//============================================================
//          resgatar dados do usuario no banco
//============================================================

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            include: [{
                model: Telefone, 
                required: false 
            }]
        });
        
        // Converte as instÃ¢ncias em objetos simples
        const usuariosPlain = usuarios.map(usuario => usuario.get({ plain: true }));
        console.log('UsuÃ¡rios encontrados:', usuariosPlain); 

        res.render('gerenciarusuario', { usuarios: usuariosPlain });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao listar usuÃ¡rios' });
    }
};


//============================================================
//                     excluir usuarios
//============================================================
const excluirUsuario = async (req, res) => {
    const { id } = req.params; // ID do usuÃ¡rio a ser excluÃ­do
    const idAdmin = req.session.userId; // ID do administrador que realizou a aÃ§Ã£o
    const usuario = await Usuario.findByPk(id);

    try {
        // Primeiro, busca os objetos associados ao usuÃ¡rio
        const objetos = await Objeto.findAll({ where: { id_usuario: id } });

        for (const objeto of objetos) {
            // Exclui as imagens associadas ao objeto
            await ImagensObjeto.destroy({ where: { id_objeto: objeto.id } });

            // Exclui os registros associados Ã s categorias especÃ­ficas
            await Veiculo.destroy({ where: { id_objeto: objeto.id } });
            await Eletronico.destroy({ where: { id_objeto: objeto.id } });
        }

        // Exclui os objetos associados ao usuÃ¡rio
        await Objeto.destroy({ where: { id_usuario: id } });

        // Exclui os telefones associados ao usuÃ¡rio
        await Telefone.destroy({ where: { id_usuario: id } });

        // Exclui o endereÃ§o associado ao usuÃ¡rio
        await Endereco.destroy({ where: { id_usuario: id } });

        // Exclui o usuÃ¡rio
        await Usuario.destroy({ where: { id } });

        // Registrar auditoria (sucesso)
        await registrarAuditoria(
            idAdmin,
            'ExclusÃ£o',
            `UsuÃ¡rio com ID: ${id} NOME: ${usuario.nome} e seus dados associados foram excluÃ­dos.`,
            'Sucesso'
        );

        // Enviar uma resposta de sucesso
        res.send(`
            <script>
                alert('UsuÃ¡rio excluÃ­do com sucesso');
                window.location.href = '/gerenciarusuario';
            </script>
        `);
    } catch (error) {
        console.error('Erro ao excluir usuÃ¡rio:', error);

        // Registrar auditoria (falha)
        await registrarAuditoria(
            idAdmin,
            'ExclusÃ£o',
            `Tentativa de excluir o usuÃ¡rio com ID ${id}.`,
            'Falha'
        );

        res.status(500).json({ message: 'Erro ao excluir usuÃ¡rio' });
    }
};


//============================================================
//              editar usuÃ¡rio pelo administrador
//============================================================

const editarNivelPermissao = async (req, res) => {
    const { permission_level, status } = req.body; 
    const user_id = req.params.id; 
    const idAdmin = req.session.userId; // ID do administrador que realizou a aÃ§Ã£o

    try {
        // Verificar se o ID do administrador estÃ¡ disponÃ­vel
        if (!idAdmin) {
            console.error('ID do administrador nÃ£o definido. Auditoria nÃ£o serÃ¡ registrada.');
            return res.status(500).json({ message: 'Erro interno.' });
        }

        // Verificar se o usuÃ¡rio existe
        const usuario = await Usuario.findByPk(user_id);

        if (!usuario) {
            await registrarAuditoria(
                idAdmin,
                'EdiÃ§Ã£o',
                `Tentativa de editar o nÃ­vel de permissÃ£o ou status do usuÃ¡rio com ID ${user_id}, mas o usuÃ¡rio nÃ£o foi encontrado.`,
                'Falha'
            );

            return res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado.' });
        }

        // Atualizar o nÃ­vel de permissÃ£o e o status do usuÃ¡rio
        await Usuario.update(
            { 
                nivel: permission_level, 
                status: status 
            },
            { where: { id: user_id } }
        );

        // Registrar auditoria de sucesso
        await registrarAuditoria(
            idAdmin,
            'EdiÃ§Ã£o',
            `NÃ­vel de permissÃ£o ou status do usuÃ¡rio com ID: ${user_id} nome: ${usuario.nome} foram atualizados. Novo nÃ­vel: ${permission_level}, Novo status: ${status}.`,
            'Sucesso'
        );

        // Redirecionar de volta para a pÃ¡gina de gerenciamento de usuÃ¡rios
        res.redirect('/gerenciarusuario');
    } catch (error) {
        console.error('Erro ao atualizar o nÃ­vel de permissÃ£o:', error);

        // Registrar falha na auditoria
        if (idAdmin) {
            await registrarAuditoria(
                idAdmin,
                'EdiÃ§Ã£o',
                `Tentativa de atualizar o nÃ­vel de permissÃ£o ou status do usuÃ¡rio com ID ${user_id}.`,
                'Falha'
            );
        }

        res.status(500).json({ message: 'Erro ao atualizar o nÃ­vel de permissÃ£o.' });
    }
};


//============================================================
//          cadastro do objeto no banco de dados
//============================================================


const cadastrarObjeto = async (req, res) => {
    try {
        const {
            reward,
            crimeType,
            color,
            crimeDetails,
            additionalInfo,
            status,
            category,
            modelvehicle,
            identifier,
            vehicleType,
            plate,
            chassis,
            brandtelefono,
            modeltelefono,
            objectType
        } = req.body;

        // Obter o id do usuÃ¡rio da sessÃ£o
        const userId = req.session.userId;

        // Busca o usuÃ¡rio logado para verificar o status
        const usuario = await Usuario.findOne({
            where: { id: userId }
        });

       

        // Log do ID do usuÃ¡rio e dados enviados
        console.log("ID do usuÃ¡rio:", userId);
        console.log("Dados enviados:", req.body);

        // Cria o objeto na tabela OBJETO, incluindo o id_usuario
        const novoObjeto = await Objeto.create({
            recompensa: reward,
            crime: crimeType,
            cor: color,
            det_crime: crimeDetails,
            inf_adicionais: additionalInfo,
            status: status,
            categoria: category,
            id_usuario: userId 
        });

        // Verifique se imagens foram enviadas
        if (req.files && req.files.length > 0) {
            const imagePaths = req.files.map(file => `/img/uploads/${file.filename}`);

            // Armazena cada imagem no banco de dados
            for (const imagePath of imagePaths) {
                await ImagensObjeto.create({
                    id_objeto: novoObjeto.id,
                    img1: imagePath
                });
            }
        }

        // Verifica a categoria e insere dados nas tabelas especÃ­ficas
        if (category === 'eletronico') {
            await Eletronico.create({
                id_objeto: novoObjeto.id,
                marca: brandtelefono,
                modelo: modeltelefono,
                cod_identificador: identifier,
                tipo: objectType
            });
        } else if (category === 'veiculo') {
            await Veiculo.create({
                id_objeto: novoObjeto.id,
                marca: req.body.brandVehicle,
                modelo: modelvehicle,
                placa: plate,
                chassi: chassis,
                tipo: vehicleType
            });
        }

 
        // Registrar auditoria de criação do objeto
        try {
            await registrarAuditoria(
                userId,
                'Cadastro Objeto',
                `Objeto criado com ID ${novoObjeto.id} (categoria: ${category}).`,
                'Sucesso'
            );
        } catch (e) {
            console.warn('Falha ao registrar auditoria de criação de objeto:', e);
        }

        const nivel = req.session.nivel;
        if (nivel === '2') {
            res.send(`
                <script>
                    alert('Objeto cadastrado com sucesso');
                    window.location.href = '/gerenciarobjeto';
                </script>
            `);
        } else {
            res.send(`
                <script>
                    alert('Objeto cadastrado com sucesso');
                    window.location.href = '/meusobjetos';
                </script>
            `);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar objeto' });
    }
};

//============================================================
//                      ediÃ§Ã£o do objeto (post)
//============================================================

const editarObjeto = async (req, res) => {
    const objetoId = req.params.id;
    const idUsuario = req.session.userId; // ID do usuÃ¡rio que realizou a aÃ§Ã£o
    const nivel = req.session.nivel;

    try {
        // Verificar se o ID do usuÃ¡rio estÃ¡ disponÃ­vel
        if (!idUsuario) {
            console.error('ID do usuÃ¡rio nÃ£o definido. Auditoria nÃ£o serÃ¡ registrada.');
            return res.status(500).json({ error: 'Erro interno.' });
        }

        console.log('ID do objeto:', objetoId);

        // Buscar objeto pelo ID
        const objeto = await Objeto.findByPk(objetoId);
        if (!objeto) {
            console.error('Objeto nÃ£o encontrado no banco de dados.');

            // Registrar auditoria de falha
            await registrarAuditoria(
                idUsuario,
                'EdiÃ§Ã£o',
                `Tentativa de editar objeto com ID ${objetoId}, mas o objeto nÃ£o foi encontrado.`,
                'Falha'
            );

            return res.status(404).json({ error: 'Objeto nÃ£o encontrado.' });
        }

        // Buscar o usuÃ¡rio responsÃ¡vel pelo objeto
        const usuarioResponsavel = await Usuario.findByPk(objeto.id_usuario); // 'id_usuario' Ã© a chave estrangeira
        
        const {
            reward, crimeType, color, crimeDetails, additionalInfo, status,
            category, identifier, modelEletronico, modelVehicle, brandVehicle,
            plate, chassis, vehicleType, brandEletronico, objectType
        } = req.body;

        // Atualizar dados do objeto principal
        await objeto.update({
            recompensa: reward,
            crime: crimeType,
            cor: color,
            det_crime: crimeDetails,
            inf_adicionais: additionalInfo,
            status: status,
            categoria: category || objeto.categoria
        });
        console.log('Objeto atualizado com sucesso.');

        // Registrar auditoria de atualizaÃ§Ã£o do objeto principal
        await registrarAuditoria(
            idUsuario,
            'EdiÃ§Ã£o',
            `Objeto com ID ${objetoId} foi atualizado. O objeto pertence ao usuÃ¡rio com id: ${usuarioResponsavel.id} nome: ${usuarioResponsavel.nome}`,
            'Sucesso'
        );

        // Verifica se hÃ¡ arquivos de imagem recebidos
        if (req.files && req.files.length > 0) {
            const imagePaths = req.files.map(file => `/img/uploads/${file.filename}`);

            // Adiciona as novas imagens ao banco de dados
            for (const imagePath of imagePaths) {
                await ImagensObjeto.create({
                    id_objeto: objeto.id,
                    img1: imagePath
                });
            }
            console.log('Novas imagens adicionadas com sucesso.');
        } else {
            console.log('Nenhuma nova imagem recebida para atualizaÃ§Ã£o.');
        }

        // Atualizar tabela relacionada com base na categoria
        if (category === 'eletronico') {
            let eletronico = await Eletronico.findOne({ where: { id_objeto: objeto.id } });
            if (eletronico) {
                await eletronico.update({
                    marca: brandEletronico,
                    modelo: modelEletronico,
                    cod_identificador: identifier,
                    tipo: objectType
                });
                console.log('Dados atualizados no EletrÃ´nico com sucesso.');
            } else {
                await Eletronico.create({
                    id_objeto: objeto.id,
                    marca: brandEletronico,
                    modelo: modelEletronico,
                    cod_identificador: identifier,
                    tipo: objectType
                });
                console.log('Novo EletrÃ´nico criado com sucesso.');
            }
        } else if (category === 'veiculo') {
            let veiculo = await Veiculo.findOne({ where: { id_objeto: objeto.id } });
            if (veiculo) {
                await veiculo.update({
                    marca: brandVehicle,
                    modelo: modelVehicle,
                    placa: plate,
                    chassi: chassis,
                    tipo: vehicleType
                });
                console.log('Dados atualizados no VeÃ­culo com sucesso.');
            } else {
                await Veiculo.create({
                    id_objeto: objeto.id,
                    marca: brandVehicle,
                    modelo: modelVehicle,
                    placa: plate,
                    chassi: chassis,
                    tipo: vehicleType
                });
                console.log('Novo VeÃ­culo criado com sucesso.');
            }
        } else {
            console.warn('Categoria nÃ£o reconhecida ou nÃ£o aplicÃ¡vel para atualizaÃ§Ã£o.');
        }

        // Redirecionar com mensagem de sucesso
        const redirectUrl = nivel === '2' ? '/gerenciarobjeto' : '/meusobjetos';

        res.send(`
            <script>
                alert('Objeto atualizado com sucesso');
                window.location.href = '${redirectUrl}';
            </script>
        `);

    } catch (error) {
        console.error('Erro ao atualizar o objeto:', error);

        // Registrar auditoria de falha
        if (idUsuario) {
            await registrarAuditoria(
                idUsuario,
                'EdiÃ§Ã£o',
                `Tentativa de editar objeto com ID ${objetoId}.`,
                'Falha'
            );
        }

        res.status(500).json({ error: 'Erro ao atualizar o objeto.' });
    }
};



//====================================
//          excluir imagem
//=====================================


const excluirImagem = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await ImagensObjeto.destroy({ where: { id } });

        if (resultado) {
            res.send(`
                <script>
                    alert('Imagem excluÃ­da com sucesso');
                    window.location.href = '/meusobjetos';
                </script>
            `);
        } else {
            res.status(404).json({ message: 'Imagem nÃ£o encontrada' });
        }
    } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        res.status(500).json({ message: 'Erro ao excluir imagem' });
    }
};



//============================================================
//              funÃ§Ã£o para login e logout do usuÃ¡rio
//============================================================

// Controller de login
const loginController = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Verifique se o usuÃ¡rio existe pelo email
        const usuario = await Usuario.findOne({ where: { email: username } });
        
        if (!usuario) {
            return res.status(401).json({ message: 'Email ou senha invÃ¡lidos.' });
        }

        // Comparar a senha preenchida com a senha criptografada
        const isPasswordValid = await bcrypt.compare(password, usuario.senha);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou senha invÃ¡lidos.' });
        }

        // Se a autenticaÃ§Ã£o for bem-sucedida, inicie a sessÃ£o
        if (!req.session) {
            console.error('SessÃ£o nÃ£o inicializada');
            return res.status(500).json({ message: 'Erro no servidor. SessÃ£o nÃ£o inicializada.' });
        }

        // Armazena o ID do usuÃ¡rio e o nÃ­vel na sessÃ£o
        req.session.userId = usuario.id; 
        req.session.nivel = usuario.nivel;

        console.log('SessÃ£o apÃ³s login:', req.session);
        req.session.nomeUsuario = usuario.nome;
        req.session.save((err) => {
            if (err) { console.error('Erro ao salvar sessão:', err); }
            return res.redirect('/home');
        });
        
     

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


//============================================================
//                  funÃ§Ã£o de logout do usuÃ¡rio
//============================================================

const logoutController = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar sessÃ£o:', err);
            return res.status(500).json({ message: 'Erro ao encerrar sessÃ£o.' });
        }
        res.redirect('/home'); // Redireciona para a pÃ¡gina de login
    });
};

//============================================================
//      resgatar os objetos postados pelo usuÃ¡rio logado
//============================================================

const listarObjetosUsuario = async (req, res) => { 
    try {
        const objetos = await Objeto.findAll({
            where: { id_usuario: req.session.userId },
            include: [{
                model: ImagensObjeto,
                as: 'imagens'
            }]
        });

        // Verifique se existem imagens e ajuste o caminho
        objetos.forEach(objeto => {
            if (objeto.imagens.length > 0) {
                objeto.imagens.forEach(imagem => {
                 
                    imagem.imgPaths = `/img/uploads/${imagem.img1}`; 
                    console.log('Caminho da Imagem:', imagem.imgPaths); 
                });
            }
        });

        res.render('meusObjetos', { objetos });
    } catch (error) {
        console.error('Erro ao listar objetos:', error);
        res.status(500).send('Erro ao listar objetos');
    }
};
 




//============================================================
// excluir post (objeto do usuÃ¡rio)
//============================================================


const excluirObjeto = async (req, res) => {
    const objetoId = req.params.id;
    const idUsuario = req.session.userId; // ID do usuÃ¡rio que realizou a aÃ§Ã£o
    const nivel = req.session.nivel;

    try {
        // Verificar se o ID do usuÃ¡rio estÃ¡ disponÃ­vel
        if (!idUsuario) {
            console.error('ID do usuÃ¡rio nÃ£o definido. Auditoria nÃ£o serÃ¡ registrada.');
            return res.status(500).json({ message: 'Erro interno.' });
        }

        // Tenta encontrar o objeto para verificar sua categoria
        const objeto = await Objeto.findOne({ where: { id: objetoId } });

        if (!objeto) {
            // Registrar auditoria de falha
            await registrarAuditoria(
                idUsuario,
                'ExclusÃ£o',
                `Tentativa de excluir o objeto com ID ${objetoId}, mas o objeto nÃ£o foi encontrado.`,
                'Falha'
            );

            return res.status(404).json({ error: 'Objeto nÃ£o encontrado.' });
        }

        const usuarioResponsavel = await Usuario.findByPk(objeto.id_usuario); // 'id_usuario' Ã© a chave estrangeira
       

        // Excluir imagens associadas ao objeto
        await ImagensObjeto.destroy({ where: { id_objeto: objetoId } });

        // Verificar a categoria e excluir registros relacionados
        if (objeto.categoria === 'eletronico') {
            await Eletronico.destroy({ where: { id_objeto: objetoId } });
        } else if (objeto.categoria === 'veiculo') {
            await Veiculo.destroy({ where: { id_objeto: objetoId } });
        }

        // Excluir o objeto da tabela OBJETO
        await Objeto.destroy({ where: { id: objetoId } });

        // Registrar auditoria de sucesso
        await registrarAuditoria(
            idUsuario,
            'ExclusÃ£o',
            `Objeto com ID ${objetoId} e categoria ${objeto.categoria} foi excluÃ­do. O objeto pertence ao usuÃ¡rio com id: ${usuarioResponsavel.id} nome: ${usuarioResponsavel.nome}`,
            'Sucesso'
        );

        // Redirecionar para a pÃ¡gina correta com mensagem de sucesso
        if (nivel === '2') {
            res.send(`
                <script>
                    alert('Objeto excluÃ­do com sucesso');
                    window.location.href = '/gerenciarobjeto';
                </script>
            `);
        } else {
            res.send(`
                <script>
                    alert('Objeto excluÃ­do com sucesso');
                    window.location.href = '/meusobjetos';
                </script>
            `);
        }
    } catch (error) {
        console.error('Erro ao excluir objeto:', error);

        // Registrar auditoria de falha
        if (idUsuario) {
            await registrarAuditoria(
                idUsuario,
                'ExclusÃ£o',
                `Tentativa de excluir o objeto com ID ${objetoId}.`,
                'Falha'
            );
        }

        res.status(500).json({ message: 'Erro ao excluir objeto.' });
    }
};



//============================================================

const listarObjetosTodos = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = 50;
        const offset = (page - 1) * limit;

        const { rows, count } = await Objeto.findAndCountAll({
            include: [{
                model: ImagensObjeto,
                as: 'imagens'
            }],
            order: [['id', 'DESC']],
            limit,
            offset
        });

        const totalItems = count;
        const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
        const hasPrev = page > 1;
        const hasNext = page < totalPages;
        const prevPage = hasPrev ? page - 1 : 1;
        const nextPage = hasNext ? page + 1 : totalPages;

        // Ajuste opcional de path caso necessário (img1 já armazena o caminho completo)
        rows.forEach(objeto => {
            if (objeto.imagens && objeto.imagens.length > 0) {
                objeto.imagens.forEach(imagem => {
                    imagem.imgPath = `/img/uploads/${imagem.img1}`;
                });
            }
        });

        res.render('home', {
            objetos: rows,
            pagination: {
                page,
                totalPages,
                totalItems,
                hasPrev,
                hasNext,
                prevPage,
                nextPage,
                limit
            }
        });
    } catch (error) {
        console.error('Erro ao listar objetos:', error);
        res.status(500).send('Erro ao listar objetos');
    }
};


//============================================================
//                  view para objetos
//============================================================


const viewObjeto = async (req, res) => {
    const id = req.params.id;

    try {
        // Busca o objeto pelo ID, incluindo as imagens relacionadas
        const objeto = await Objeto.findOne({
            where: { id },
            include: [{ model: ImagensObjeto, as: 'imagens' }] 
        });

        // Verifica se o objeto foi encontrado
        if (!objeto) {
            return res.status(404).render('error', { message: 'Objeto nÃ£o encontrado.' });
        }

        let detalhesAdicionais = null;

        // Carrega dados adicionais dependendo da categoria
        if (objeto.categoria === 'eletronico') {
            detalhesAdicionais = await Eletronico.findOne({
                where: { id_objeto: objeto.id }
            });
        } else if (objeto.categoria === 'veiculo') {
            detalhesAdicionais = await Veiculo.findOne({
                where: { id_objeto: objeto.id }
            });
        }

        // Renderiza a view com o objeto e detalhes adicionais
        res.render('viewObjetos', { objeto, detalhesAdicionais });
    } catch (error) {
        console.error("Erro ao buscar objeto:", error);
        res.status(500).render('error', { message: 'Erro ao carregar objeto.' });
    }
};

//==========================================================
//          gerenciar objeto
//==========================================================

const gerenciarObjetos = async (req, res) => {
    try {
        // Busca todos os objetos, incluindo suas imagens
        const objetos = await Objeto.findAll({
            include: [
                { 
                    model: ImagensObjeto, 
                    as: 'imagens' 
                },
                { 
                    model: Usuario, 
                    as: 'usuario',  
                    attributes: ['nome']
                }
            
            ] 
        });

        // Verifica se a busca retornou objetos
        console.log("Objetos encontrados:", objetos); // Para depuraÃ§Ã£o

        // Renderiza a view com a lista de objetos
        res.render('gerenciarobjeto', { objetos });
    } catch (error) {
        console.error("Erro ao buscar objetos:", error);
        res.status(500).render('error', { message: 'Erro ao carregar objetos.' });
    }
};


//============================================================
//                      filtro por categoria
//============================================================

const buscarObjetosPorCategoria = async (categoria) => {
    try {
        if (categoria === 'todos') {
            // Busca todos os objetos, incluindo as imagens relacionadas
            return await Objeto.findAll({
                include: [{ model: ImagensObjeto, as: 'imagens' }], // Inclui as imagens
                order: [['id', 'DESC']]
            });
        }

        // Busca os objetos da categoria filtrada, incluindo as imagens relacionadas
        const objetos = await Objeto.findAll({
            where: {
                categoria: {
                    [Op.eq]: categoria 
                }
            },
            include: [{ model: ImagensObjeto, as: 'imagens' }],
            order: [['id', 'DESC']]
        });
        return objetos;
    } catch (error) {
        console.error('Erro ao buscar objetos por categoria:', error);
        throw error; 
    }
};

//============================================================
//                      filtro por status
//============================================================

const buscarObjetosPorStatus = async (status, usuarioId) => {
    try {
        console.log('Status recebido para o filtro:', status);
        console.log('ID do usuÃ¡rio:', usuarioId);

        const statusValidos = ['todos', 'roubado', 'furtado', 'recuperado'];
        if (!statusValidos.includes(status)) {
            throw new Error('Status invÃ¡lido.');
        }

        let whereClause = { id_usuario: usuarioId }; // Filtra pelos objetos do usuÃ¡rio

        if (status !== 'todos') {
            whereClause.status = status; // Adiciona o filtro de status se nÃ£o for 'todos'
        }

        // Log da clÃ¡usula where antes da consulta
        console.log('ClÃ¡usula WHERE:', whereClause);

        // Busca os objetos com base no filtro
        const objetos = await Objeto.findAll({
            where: whereClause,
            include: [{ model: ImagensObjeto, as: 'imagens' }]
        });

        // Log para verificar os objetos encontrados
        console.log('Objetos encontrados:', objetos);

        return objetos;
    } catch (error) {
        console.error('Erro ao buscar objetos por status:', error);
        throw error;
    }
};



//============================================================
//              carrregar dados do usuÃ¡rio 
//============================================================


const CarregarDadosUsuario = async (req, res) => {
    try {
        const userId = req.session.userId;
        const usuario = await Usuario.findOne({
            where: { id: userId },
            include: [
                { model: Telefone, as: 'Telefones',}, 
                { model: Endereco, as: 'Enderecos',}
            ]
        });

        console.log('Dados do UsuÃ¡rio:', usuario.toJSON());
        console.log('Telefones:', usuario.Telefones);
        console.log('EndereÃ§os:', usuario.Enderecos);

        if (!usuario) {
            return res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado' });
        }

        res.render('meusdados', { usuario });
    } catch (error) {
        console.error("Erro ao buscar dados do usuÃ¡rio:", error);
        res.status(500).json({ message: 'Erro ao buscar dados do usuÃ¡rio' });
    }
};

//====================================================
// carregar dados do usuario para ediÃ§Ã£o / sÃ¡bado
//===================================================

const carregarDadosUsuarioParaEdicao = async (req, res) => {
    const userId = req.params.id; 

    try {
        // Busca o usuÃ¡rio no banco de dados, incluindo telefones e endereÃ§os
        const usuario = await Usuario.findByPk(userId, {
            include: [
                {
                    model: Telefone,
                    as: 'Telefones',
                    
                },
                {
                    model: Endereco,
                    as: 'Enderecos', 
                },
            ],
        });

        if (!usuario) {
            return res.status(404).render('meusdados', { message: 'UsuÃ¡rio nÃ£o encontrado.' });
        }

        // Renderiza a view de ediÃ§Ã£o com os dados do usuÃ¡rio, telefones e endereÃ§os
        res.render('formularios/editarusuario', { 
            usuario,
            layout: 'formularios'
        });
    } catch (error) {
        console.error('Erro ao buscar usuÃ¡rio:', error);
        res.status(500).send('Erro ao buscar usuÃ¡rio.');
    }
};


//==========================================================================
//   atualizar dados do usuario no banco / sÃ¡bado
//==========================================================================

const atualizarUsuario = async (req, res) => {
    const user_id = req.params.id;
    const { nome, email, cpf, sexo, data_nascimento, nivel, status } = req.body;

    try {
        // Verifica se o usuÃ¡rio existe
        const usuario = await Usuario.findByPk(user_id);
        if (!usuario) {
            return res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado.' });
        }

        // Atualiza os dados do usuÃ¡rio
        await Usuario.update(
            {
                nome,
                email,
                cpf,
                sexo,
                data_nascimento,
                nivel,
                status
            },
            { where: { id: user_id } }
        );


   // Captura todos os telefones existentes para atualizaÃ§Ã£o
const telefoneKeys = Object.keys(req.body).filter(key => key.startsWith('telefone_numero_'));

const telefonesPromises = telefoneKeys.map(key => {
    const telefoneId = parseInt(key.split('_')[2], 10); 
    const numero = req.body[key]; 
    const tipo = req.body[`tipo_telefone_${telefoneId}`]; 

    return Telefone.update(
        { numero, tipo },
        { where: { id: telefoneId, id_usuario: user_id } }
    ).catch(error => {
        console.error(`Erro ao atualizar telefone ID ${telefoneId}:`, error);
        return Promise.resolve(); 
    });
});

// Atualiza todos os telefones existentes
await Promise.all(telefonesPromises);

     
     // Verifica se um novo telefone foi adicionado
     if (req.body.novo_telefone) {
         const novoTelefone = req.body.novo_telefone; 
         const tipoNovoTelefone = req.body.tipo_novo_telefone; 
     
         // Adiciona o novo telefone ao banco de dados
         await Telefone.create({
             numero: novoTelefone,
             id_usuario: user_id,
             tipo: tipoNovoTelefone 
         }).catch(error => {
             console.error(`Erro ao adicionar novo telefone:`, error);
         });
     }
     



     const enderecoKeys = Object.keys(req.body).filter(key => key.startsWith('endereco_id_'));

const enderecosPromises = enderecoKeys.map(key => {
    const enderecoId = parseInt(req.body[key], 10); 
    const rua = req.body[`rua_${enderecoId}`]; 
    const numero = req.body[`numero_${enderecoId}`]; 
    const bairro = req.body[`bairro_${enderecoId}`]; 
    const cidade = req.body[`cidade_${enderecoId}`]; 
    const estado = req.body[`estado_${enderecoId}`]; 

    // Adiciona logs para depuraÃ§Ã£o
    console.log(`Atualizando endereÃ§o ID ${enderecoId}:`, { rua, numero, bairro, cidade, estado });

    // Atualiza o endereÃ§o
    return Endereco.update(
        { rua, numero, bairro, cidade, estado },
        { where: { id: enderecoId } } // Atualiza a linha correspondente na tabela Endereco
    ).catch(error => {
        console.error(`Erro ao atualizar endereÃ§o ID ${enderecoId}:`, error);
        return Promise.resolve();
    });
});

await Promise.all(enderecosPromises);

        res.send(`
            <script>
                alert('Dados atualizado com sucesso');
                window.location.href = '/meusdados';
            </script>
        `);
   
    } catch (error) {
        console.error('Erro ao atualizar o usuÃ¡rio:', error);
        res.status(500).json({ message: 'Erro ao atualizar o usuÃ¡rio.' });
    }
};





//============================================================
//                   buscar o usuÃ¡rio
//============================================================


const buscarUsuario = async (req, res) => {
    try {

        const usuarioId = req.params.id;


        const usuario = await Usuario.findByPk(usuarioId, {
            include: ['telefones', 'endereco'] 
        });

        if (!usuario) {
            return res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado' });
        }
        res.render('formularios/cadastro', { usuario });
    } catch (error) {
        console.error('Erro ao buscar usuÃ¡rio:', error);
        res.status(500).json({ message: 'Erro ao buscar usuÃ¡rio' });
    }
};

//==============================


const buscarObjetos = async (req, res) => {
    try {
        const termo = req.query.termo;
        
        if (!termo) {
            return res.render('buscapostagem', { objetos: [], termo });
        }

        const objetos = await Objeto.findAll({
            where: {
                [Op.or]: [
                    { crime: { [Op.like]: `%${termo}%` } },
                    { cor: { [Op.like]: `%${termo}%` } },
                    { det_crime: { [Op.like]: `%${termo}%` } },
                    { inf_adicionais: { [Op.like]: `%${termo}%` } },
                    { status: { [Op.like]: `%${termo}%` } },
                    { categoria: { [Op.like]: `%${termo}%` } }
                ]
            },
            include: [{
                model: ImagensObjeto,
                as: 'imagens'
            }]
        });

        objetos.forEach(objeto => {
            if (objeto.imagens.length > 0) {
                objeto.imagens.forEach(imagem => {
                    imagem.imgPath = `/img/uploads/${imagem.img1}`;
                });
            }
        });

        res.render('buscapostagem', { objetos, termo });
    } catch (error) {
        console.error('Erro ao buscar objetos:', error);
        res.status(500).send('Erro ao buscar objetos');
    }
};


//==============================================================
//              exibir a auditoria de registros
//=============================================================

// moment já importado acima

async function listarAuditorias(req, res) {
    try {
        const registros = await Auditoria.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: ['id', 'nome'], 
                },
            ],
            order: [['data_acao', 'DESC']], 
        });


        const registrosFormatados = registros.map(registro => ({
            ...registro.toJSON(), 
            data_acao: moment(registro.data_acao).format('YYYY-MM-DD HH:mm:ss'),
        }));


        res.render('auditorias', { registros: registrosFormatados });
    } catch (error) {
        console.error('Erro ao listar auditorias:', error);
        res.status(500).send('Erro ao listar auditorias.');
    }
}


//===============================================================
            //filtro de auditorias
//===============================================================


async function filtrarAuditorias(req, res) {
    try {
        // Recebe os parÃ¢metros de data do formulÃ¡rio
        const { dataInicio, dataFim } = req.query;

        // Valida se as datas foram fornecidas
        if (!dataInicio || !dataFim) {
            return res.status(400).send('Por favor, forneÃ§a as datas de inÃ­cio e fim.');
        }

        // Converte as datas para o formato adequado
        const dataInicioFormatada = moment(dataInicio, 'YYYY-MM-DD').startOf('day').toDate();
        const dataFimFormatada = moment(dataFim, 'YYYY-MM-DD').endOf('day').toDate();

        // Busca os registros de auditoria no intervalo de datas
        const registros = await Auditoria.findAll({
            where: {
                data_acao: {
                    [Op.between]: [dataInicioFormatada, dataFimFormatada],
                },
            },
            include: [
                {
                    model: Usuario,
                    attributes: ['id', 'nome'], // Campos desejados do Usuario
                },
            ],
            order: [['data_acao', 'DESC']], // OrdenaÃ§Ã£o pela data da aÃ§Ã£o (opcional)
        });

        // Renderiza a view com os registros encontrados
        res.render('auditorias', { registros });
    } catch (error) {
        console.error('Erro ao listar auditorias:', error);
        res.status(500).send('Erro ao listar auditorias.');
    }
}



//============================================================
//              validaÃ§Ã£o de e-mail (AJAX)
//============================================================
module.exports = {
    cadastrarUsuario,
    listarUsuarios,
    excluirUsuario,
    editarNivelPermissao,
    cadastrarObjeto,
    loginController,
    logoutController,
    listarObjetosUsuario,
    excluirObjeto,
    editarObjeto,
    getDashboard,
    listarObjetosTodos,
    viewObjeto,
    buscarObjetosPorCategoria,
    buscarObjetosPorStatus,
    CarregarDadosUsuario,
    buscarUsuario,
    carregarDadosUsuarioParaEdicao,
    atualizarUsuario,
    gerenciarObjetos,
    buscarObjetos,
    excluirImagem,
    registrarAuditoria,
    listarAuditorias,
    filtrarAuditorias
    
    
    
};


