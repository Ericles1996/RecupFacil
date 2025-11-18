// models/auditoria.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const Usuario = require('./Usuario')

const Auditoria = sequelize.define('Auditoria', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tipo_acao: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    data_acao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    detalhes: {
        type: DataTypes.TEXT,
    },
    resultado: {
        type: DataTypes.STRING(50),
    },
}, {
    tableName: 'AUDITORIA',
    timestamps: false,
});

// Associação com o modelo Usuario
Auditoria.associate = function(models) {
    Auditoria.belongsTo(Usuario, {
        foreignKey: 'id_usuario', 
        as: 'usuario', 
    });
};

module.exports = Auditoria;


