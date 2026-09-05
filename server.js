const express = require('express');
const { nanoid } = require('nanoid');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Servidor do encurtador de links está no ar! 🚀');
});

app.post('/api/encurtar', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ erro: 'Você precisa enviar uma URL no campo "url"' });
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ erro: 'A URL precisa começar com http:// ou https://' });
  }

  const codigo = nanoid(6);

  db.get('links').set(codigo, { url: url, cliques: 0 }).write();

  res.json({
    original: url,
    curto: `${req.protocol}://${req.get('host')}/${codigo}`
  });
});

app.get('/api/estatisticas', (req, res) => {
  const links = db.get('links').value();

  res.json(links);
});

app.get('/:codigo', (req, res) => {
  const { codigo } = req.params;

  const link = db.get('links').get(codigo).value();

  if (!link) {
    return res.status(404).send('Link não encontrado');
  }

  db.get('links').get(codigo).update('cliques', n => n + 1).write();

  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3;url=${link.url}">
        <title>Redirecionando...</title>
      </head>
      <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h2>Você vai ser redirecionado em instantes...</h2>
        <p>Aqui entra o espaço de anúncio ou link de afiliado</p>
        <p>Se não for redirecionado automaticamente, <a href="${link.url}">clique aqui</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});