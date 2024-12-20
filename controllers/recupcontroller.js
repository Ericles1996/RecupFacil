// controllers/userController.js
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const Telefone = require('../models/Telefone');
const Endereco = require('../models/Endereco');
const path = require('path');
const { Op } = require('sequelize');

const { Objeto, Eletronico, Veiculo,  ImagensObjeto} = require('../models'); 

//============================================================
//              cadastro de usuário
//============================================================


const cadastrarUsuario = async (req, res) => {
    try {
        const { username, cpf, email, password, confirm_password, gender, birthdate, phone1, phone1_type, phone2, phone2_type, state, city, neighborhood, street, number, cep, permission_level, status } = req.body;

        if (password !== confirm_password) {
            return res.send(`
                <script>
                    alert('As senhas não coincidem. Por favor, tente novamente.');
                    window.history.back();
                </script>
            `);
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Senha criptografada durante o cadastro:", hashedPassword);
        
        const usuarioStatus = status || 'Ativo';


        // Inserir o usuário na tabela USUARIO
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

        // Inserir o endereço na tabela ENDERECO
        await Endereco.create({
            id_usuario: usuario.id,
            numero: number,
            cidade: city,
            bairro: neighborhood,
            cep: cep,
            rua: street,
            estado: state
        });

    // Responder com uma mensagem de alerta e redirecionar para a página de login

    const nivel = req.session.nivel;
    if (nivel === '2') {
        res.send(`
            <script>
                alert('Usuário cadastrado com sucesso');
                window.location.href = '/gerenciarusuario';
            </script>
        `);
    } else {
        res.send(`
            <script>
                alert('Usuário cadastrado com sucesso');
                window.location.href = '/login';
            </script>
        `);
    }
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
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
        
        // Converte as instâncias em objetos simples
        const usuariosPlain = usuarios.map(usuario => usuario.get({ plain: true }));
        console.log('Usuários encontrados:', usuariosPlain); 

        res.render('gerenciarusuario', { usuarios: usuariosPlain });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao listar usuários' });
    }
};


//============================================================
//                     excluir usuarios
//============================================================
const excluirUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Primeiro, exclui os objetos associados ao usuário
        const objetos = await Objeto.findAll({ where: { id_usuario: id } });

        for (const objeto of objetos) {
            await ImagensObjeto.destroy({ where: { id_objeto: objeto.id } });
            await Veiculo.destroy({ where: { id_objeto: objeto.id } });
            await Eletronico.destroy({ where: { id_objeto: objeto.id } });
        }

        // Exclui os objetos associados ao usuário
        await Objeto.destroy({ where: { id_usuario: id } });

        // Exclui os telefones associados ao usuário
        await Telefone.destroy({ where: { id_usuario: id } });

        // Exclui o endereço associado ao usuário
        await Endereco.destroy({ where: { id_usuario: id } });

        // Exclui o usuário
        await Usuario.destroy({ where: { id } });

        // Enviar uma resposta de sucesso
        res.send(`
            <script>
                alert('Usuário excluído com sucesso');
                window.location.href = '/gerenciarusuario';
            </script>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir usuário' });
    }
};


//============================================================
//              editar usuário pelo administrador
//============================================================

const editarNivelPermissao = async (req, res) => {
    const { permission_level, status } = req.body; 
    const user_id = req.params.id; 

    try {
        // Verificar se o usuário existe
        const usuario = await Usuario.findByPk(user_id);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Atualizar o nível de permissão e o status do usuário
        await Usuario.update(
            { 
                nivel: permission_level, 
                status: status 
            },
            { where: { id: user_id } } 
        );

        // Redirecionar de volta para a página de gerenciamento de usuários
        res.redirect('/gerenciarusuario');
    } catch (error) {
        console.error('Erro ao atualizar o nível de permissão:', error);
        res.status(500).json({ message: 'Erro ao atualizar o nível de permissão.' });
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

        // Obter o id do usuário da sessão
        const userId = req.session.userId;

        // Busca o usuário logado para verificar o status
        const usuario = await Usuario.findOne({
            where: { id: userId }
        });

       

        // Log do ID do usuário e dados enviados
        console.log("ID do usuário:", userId);
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

        // Verifica a categoria e insere dados nas tabelas específicas
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
//                      edição do objeto (post)
//============================================================

const fs = require('fs');

const editarObjeto = async (req, res) => {
    try {
        
        const objetoId = req.params.id;
        console.log('ID do objeto:', objetoId);

        // Buscar objeto pelo ID
        const objeto = await Objeto.findByPk(objetoId);
        if (!objeto) {
            console.error('Objeto não encontrado no banco de dados.');
            return res.status(404).json({ error: 'Objeto não encontrado.' });
        }

  
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

        // Verifica se há arquivos de imagem recebidos
  
const imagensExistentes = await ImagensObjeto.findAll({ where: { id_objeto: objeto.id } });

// Verificar se existem arquivos novos para upload
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
    console.log('Nenhuma nova imagem recebida para atualização.');
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
                console.log('Dados atualizados no Eletrônico com sucesso.');
            } else {
                await Eletronico.create({
                    id_objeto: objeto.id,
                    marca: brandEletronico,
                    modelo: modelEletronico,
                    cod_identificador: identifier,
                    tipo: objectType
                });
                console.log('Novo Eletrônico criado com sucesso.');
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
                console.log('Dados atualizados no Veículo com sucesso.');
            } else {
                await Veiculo.create({
                    id_objeto: objeto.id,
                    marca: brandVehicle,
                    modelo: modelVehicle,
                    placa: plate,
                    chassi: chassis,
                    tipo: vehicleType
                });
                console.log('Novo Veículo criado com sucesso.');
            }
        } else {
            console.warn('Categoria não reconhecida ou não aplicável para atualização.');
        }

        // Redirecionar com mensagem de sucesso
        const nivel = req.session.nivel;
        const redirectUrl = nivel === '2' ? '/gerenciarobjeto' : '/meusobjetos';

        res.send(`
            <script>
                alert('Objeto atualizado com sucesso');
                window.location.href = '${redirectUrl}';
            </script>
        `);

    } catch (error) {
        console.error('Erro ao atualizar o objeto:', error);
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
                    alert('Imagem excluída com sucesso');
                    window.location.href = '/meusobjetos';
                </script>
            `);
        } else {
            res.status(404).json({ message: 'Imagem não encontrada' });
        }
    } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        res.status(500).json({ message: 'Erro ao excluir imagem' });
    }
};



//============================================================
//              função para login e logout do usuário
//============================================================

// Controller de login
const loginController = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Verifique se o usuário existe pelo email
        const usuario = await Usuario.findOne({ where: { email: username } });
        
        if (!usuario) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        // Comparar a senha preenchida com a senha criptografada
        const isPasswordValid = await bcrypt.compare(password, usuario.senha);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        // Se a autenticação for bem-sucedida, inicie a sessão
        if (!req.session) {
            console.error('Sessão não inicializada');
            return res.status(500).json({ message: 'Erro no servidor. Sessão não inicializada.' });
        }

        // Armazena o ID do usuário e o nível na sessão
        req.session.userId = usuario.id; 
        req.session.nivel = usuario.nivel;

        console.log('Sessão após login:', req.session);
        res.redirect('/home');
        
     

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


//============================================================
//                  função de logout do usuário
//============================================================

const logoutController = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar sessão:', err);
            return res.status(500).json({ message: 'Erro ao encerrar sessão.' });
        }
        res.redirect('/home'); // Redireciona para a página de login
    });
};

//============================================================
//      resgatar os objetos postados pelo usuário logado
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
// excluir post (objeto do usuário)
//============================================================


const excluirObjeto = async (req, res) => {
    try {
        const objetoId = req.params.id;

        // Primeiro, tente encontrar o objeto para verificar sua categoria
        const objeto = await Objeto.findOne({
            where: { id: objetoId }
        });

        if (!objeto) {
            // Se o objeto não for encontrado, já envia uma resposta e encerra a execução
            return res.status(404).json({ error: 'Objeto não encontrado.' });
        }

        // Exclui as imagens associadas ao objeto (se houver)
        await ImagensObjeto.destroy({
            where: { id_objeto: objetoId }
        });

        // Verifica a categoria e exclui os registros relacionados de Eletronico ou Veiculo
        if (objeto.categoria === 'eletronico') {
            await Eletronico.destroy({
                where: { id_objeto: objetoId }
            });
        } else if (objeto.categoria === 'veiculo') {
            await Veiculo.destroy({
                where: { id_objeto: objetoId }
            });
        }

        // Exclui o objeto da tabela OBJETO
        await Objeto.destroy({
            where: { id: objetoId }
        });          
        
        const nivel = req.session.nivel;
        if (nivel === '2') {
            res.send(`
                <script>
                    alert('Objeto excluído com sucesso');
                    window.location.href = '/gerenciarobjeto';
                </script>
            `);
        } else {
            res.send(`
                <script>
                    alert('Objeto excluído com sucesso');
                    window.location.href = '/meusobjetos';
                </script>
            `);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar usuário' });
    }
};


//============================================================

const listarObjetosTodos = async (req, res) => {
    try {
        const objetos = await Objeto.findAll({
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

        res.render('home', { objetos }); 
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
            return res.status(404).render('error', { message: 'Objeto não encontrado.' });
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
        console.log("Objetos encontrados:", objetos); // Para depuração

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
                include: [{ model: ImagensObjeto, as: 'imagens' }] // Inclui as imagens
            });
        }

        // Busca os objetos da categoria filtrada, incluindo as imagens relacionadas
        const objetos = await Objeto.findAll({
            where: {
                categoria: {
                    [Op.eq]: categoria 
                }
            },
            include: [{ model: ImagensObjeto, as: 'imagens' }] 
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

const buscarObjetosPorStatus = async (status) => {
    try {
        // Log para verificar o valor do status recebido
        console.log('Status recebido para o filtro:', status);

        if (status === 'todos') {
            return await Objeto.findAll({
                include: [{ model: ImagensObjeto, as: 'imagens' }]
            });
        }

        const statusValidos = ['roubado', 'furtado'];
        if (!statusValidos.includes(status)) {
            throw new Error('Status inválido.');
        }

        // Busca os objetos com base no status fornecido
        const objetos = await Objeto.findAll({
            where: {
                status: {
                    [Op.eq]: status 
                }
            },
            include: [{ model: ImagensObjeto, as: 'imagens' }]
        });

        // Log para verificar se os objetos foram encontrados
        console.log('Objetos encontrados:', objetos);

        return objetos;
    } catch (error) {
        console.error('Erro ao buscar objetos por status:', error);
        throw error;
    }
};

//============================================================
//              carrregar dados do usuário 
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

        console.log('Dados do Usuário:', usuario.toJSON());
        console.log('Telefones:', usuario.Telefones);
        console.log('Endereços:', usuario.Enderecos);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.render('meusdados', { usuario });
    } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }
};

//====================================================
// carregar dados do usuario para edição / sábado
//===================================================

const carregarDadosUsuarioParaEdicao = async (req, res) => {
    const userId = req.params.id; 

    try {
        // Busca o usuário no banco de dados, incluindo telefones e endereços
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
            return res.status(404).render('meusdados', { message: 'Usuário não encontrado.' });
        }

        // Renderiza a view de edição com os dados do usuário, telefones e endereços
        res.render('formularios/editarusuario', { 
            usuario,
            layout: 'formularios'
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).send('Erro ao buscar usuário.');
    }
};


//==========================================================================
//   atualizar dados do usuario no banco / sábado
//==========================================================================

const atualizarUsuario = async (req, res) => {
    const user_id = req.params.id;
    const { nome, email, cpf, sexo, data_nascimento, nivel, status } = req.body;

    try {
        // Verifica se o usuário existe
        const usuario = await Usuario.findByPk(user_id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Atualiza os dados do usuário
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


   // Captura todos os telefones existentes para atualização
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

    // Adiciona logs para depuração
    console.log(`Atualizando endereço ID ${enderecoId}:`, { rua, numero, bairro, cidade, estado });

    // Atualiza o endereço
    return Endereco.update(
        { rua, numero, bairro, cidade, estado },
        { where: { id: enderecoId } } // Atualiza a linha correspondente na tabela Endereco
    ).catch(error => {
        console.error(`Erro ao atualizar endereço ID ${enderecoId}:`, error);
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
        console.error('Erro ao atualizar o usuário:', error);
        res.status(500).json({ message: 'Erro ao atualizar o usuário.' });
    }
};





//============================================================
//                   buscar o usuário
//============================================================


const buscarUsuario = async (req, res) => {
    try {

        const usuarioId = req.params.id;


        const usuario = await Usuario.findByPk(usuarioId, {
            include: ['telefones', 'endereco'] 
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.render('formularios/cadastro', { usuario });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro ao buscar usuário' });
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
    excluirImagem
    
    
    
};
