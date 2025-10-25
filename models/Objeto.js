const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const ImagensObjeto = require('./ImagensObjeto');

const Objeto = sequelize.define('Objeto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomeobjeto: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    recompensa: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    crime: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    cor: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    det_crime: {
        type: DataTypes.STRING(750),
        allowNull: true
    },
    inf_adicionais: {
        type: DataTypes.STRING(750),
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    id_usuario: { 
        type: DataTypes.INTEGER,
        allowNull: false, 
        references: {
            model: Usuario, 
            key: 'id' 
        }
    }
}, {
    tableName: 'OBJETO',
    timestamps: false
});

// Relações
Objeto.hasMany(ImagensObjeto, { foreignKey: 'id_objeto', as: 'imagens' });
ImagensObjeto.belongsTo(Objeto, { foreignKey: 'id_objeto' });
Objeto.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });


module.exports = Objeto;
