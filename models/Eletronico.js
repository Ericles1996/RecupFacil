// models/Eletronico.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Objeto = require('./Objeto');

const Eletronico = sequelize.define('Eletronico', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_objeto: {
        type: DataTypes.INTEGER,
        references: {
            model: Objeto,
            key: 'id'
        },
        allowNull: false
    },
    marca: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    modelo: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    cod_identificador: {
        type: DataTypes.STRING(30),
        allowNull: true
    },
    tipo: {
        type: DataTypes.STRING(15),
        allowNull: false
    }
}, {
    tableName: 'ELETRONICO',
    timestamps: false
});

Eletronico.belongsTo(Objeto, { foreignKey: 'id_objeto' });

module.exports = Eletronico;
