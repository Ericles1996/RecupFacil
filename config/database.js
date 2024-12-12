// config/database.js
const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('recuperafacil', 'bdweb', '1fp@.webM', {
    host: '141.136.42.60',
    dialect: 'mysql', 
    port: 3306, 
    logging: false 
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados foi bem-sucedida.');
    } catch (error) {
        console.error('Não foi possível conectar ao banco de dados:', error);
    }
}


testConnection();

module.exports = sequelize; 
