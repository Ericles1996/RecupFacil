// models/index.js

// Importa os modelos
const Usuario = require('./Usuario');
const Telefone = require('./Telefone');
const Endereco = require('./Endereco');
const Objeto = require('./Objeto');
const Eletronico = require('./Eletronico');
const Veiculo = require('./Veiculo');
const ImagensObjeto = require('./ImagensObjeto');

// Exporta os modelos como um objeto
module.exports = {
    Usuario,
    Telefone,
    Endereco,
    Objeto,
    Eletronico,
    Veiculo,
    ImagensObjeto
};
