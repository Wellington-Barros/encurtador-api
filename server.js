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

app.get('/api/estatisticas/:codigo', (req, res) => {
  const { codigo } = req.params;

  const link = db.get('links').get(codigo).value();

  if (!link) {
    return res.status(404).json({ erro: 'Link não encontrado' });
  }

  res.json({
    codigo: codigo,
    url: link.url,
    cliques: link.cliques
  });
});

function verificarAdmin(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    res.set('WWW-Authenticate', 'Basic realm="Painel Admin"');
    return res.status(401).send('Autenticação necessária');
  }

  const credenciais = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [usuario, senha] = credenciais.split(':');

  const usuarioCorreto = process.env.ADMIN_USER || 'admin';
  const senhaCorreta = process.env.ADMIN_PASS || 'admin';

  if (usuario === usuarioCorreto && senha === senhaCorreta) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Painel Admin"');
  return res.status(401).send('Credenciais inválidas');
}

app.get('/admin', verificarAdmin, (req, res) => {
  const links = db.get('links').value();
  const codigos = Object.keys(links);

  const totalLinks = codigos.length;
  const totalCliques = codigos.reduce((soma, codigo) => soma + links[codigo].cliques, 0);

  const linhas = codigos.slice(-20).reverse().map(codigo => `
    <tr>
      <td>${codigo}</td>
      <td>${links[codigo].url}</td>
      <td>${links[codigo].cliques}</td>
    </tr>
  `).join('');

  res.send(`
    <html>
      <head>
        <title>Painel Admin - CurtoLink</title>
        <style>
          body { font-family: sans-serif; background: #0a0a0f; color: #e5e7eb; padding: 40px; }
          h1 { color: #7c6cf6; }
          .resumo { display: flex; gap: 20px; margin-bottom: 30px; }
          .card { background: #13131a; border: 1px solid #24243a; padding: 20px; border-radius: 12px; }
          .card span { display: block; font-size: 28px; font-weight: bold; color: #a99bfb; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #24243a; padding: 8px; text-align: left; font-size: 14px; }
          th { background: #13131a; }
        </style>
      </head>
      <body>
        <h1>Painel Admin</h1>
        <div class="resumo">
          <div class="card">Total de links<span>${totalLinks}</span></div>
          <div class="card">Total de cliques<span>${totalCliques}</span></div>
        </div>
        <h2>Links mais recentes</h2>
        <table>
          <tr><th>Código</th><th>URL</th><th>Cliques</th></tr>
          ${linhas}
        </table>
      </body>
    </html>
  `);
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
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-YJKH8KD9NL"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YJKH8KD9NL');
</script>
        <meta http-equiv="refresh" content="3;url=${link.url}">
        <title>Redirecionando...</title>
      </head>
<body style="font-family: 'Segoe UI', sans-serif; text-align: center; padding-top: 60px; background: #0a0a0f; color: #e5e7eb; margin: 0;">
  <h2>Você vai ser redirecionado em instantes...</h2>
  <a href="https://semnarrativa.lojavirtualnuvem.com.br" target="_blank" style="display: inline-block; margin: 24px auto; background: #13131a; border: 1px solid #24243a; border-radius: 16px; text-decoration: none; color: #e5e7eb; max-width: 320px; overflow: hidden;">
    <span style="display: block; padding: 8px 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Publicidade</span>
    <img src="images/camiseta-sem-narrativa.jpg" alt="Camiseta Sem Narrativa" style="width: 100%; display: block;">
    <span style="display: block; padding: 16px;">
      <span style="display: block; font-size: 20px; font-weight: bold; color: #a99bfb;">Sem Narrativa</span>
      <span style="display: block; font-size: 14px; color: #9ca3af; margin-top: 4px;">Confira nossas camisetas</span>
      <span style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #7c6cf6; color: white; border-radius: 8px; font-weight: bold; font-size: 14px;">Ver coleção</span>
    </span>
  </a>
  <p style="color: #9ca3af;">Se não for redirecionado automaticamente, <a href="${link.url}" style="color: #7c6cf6;">clique aqui</a></p>
</body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});