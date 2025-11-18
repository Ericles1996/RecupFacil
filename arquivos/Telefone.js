// models/Telefone.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Telefone = sequelize.define('Telefone', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    numero: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'TELEFONE',
    timestamps: false
});

module.exports = Telefone;
