// Importamos as ferramentas do lowdb
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Dizemos ao lowdb: "guarde os dados no arquivo db.json"
const adapter = new FileSync('db.json');
const db = low(adapter);

// Se o arquivo db.json estiver vazio, começamos com uma "tabela" chamada links
// { links: {} } significa: um objeto vazio onde vamos guardar "código -> url"
db.defaults({ links: {} }).write();

// Disponibilizamos esse "db" pra outros arquivos poderem usar
module.exports = db;