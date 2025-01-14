// models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const Telefone = require('./Telefone');
const Endereco = require('./Endereco');
const Auditoria = require('./Auditoria'); 

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cpf: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sexo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    data_nascimento: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    nivel: { 
        type: DataTypes.STRING(5), 
        allowNull: false,
        defaultValue: '1',
    },
    status: { 
        type: DataTypes.STRING(20), 
        allowNull: true,
    },
}, {
    tableName: 'USUARIO',
    timestamps: false,
});

// Associações
Usuario.hasMany(Telefone, { foreignKey: 'id_usuario', sourceKey: 'id' });
Telefone.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id' });

Usuario.hasMany(Endereco, { foreignKey: 'id_usuario', sourceKey: 'id' });
Endereco.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id' });


Usuario.hasMany(Auditoria, { foreignKey: 'id_usuario', sourceKey: 'id', as: 'auditorias' });
Auditoria.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id' });

module.exports = Usuario;
