// models/Veiculo.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Objeto = require('./Objeto');

const Veiculo = sequelize.define('Veiculo', {
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
    placa: {
        type: DataTypes.STRING(9),
        allowNull: true
    },
    chassi: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    tipo: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
}, {
    tableName: 'VEICULO',
    timestamps: false
});

Veiculo.belongsTo(Objeto, { foreignKey: 'id_objeto' });

module.exports = Veiculo;
