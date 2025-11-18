// models/ImagensObjeto.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImagensObjeto = sequelize.define('ImagensObjeto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_objeto: {
        type: DataTypes.INTEGER,
        references: {
            model: 'OBJETO',
            key: 'id'
        },
        allowNull: false
    },
    img1: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'IMAGENS_OBJETO',
    timestamps: false
});


module.exports = ImagensObjeto;
