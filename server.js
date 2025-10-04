const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cookies = "segredo123";
const session = require("express-session");
const path = require("path");

const app = express();
const db = new sqlite3.Database("./db.sqlite");

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "segredo-super-seguro",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, "views")));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    email TEXT
  )`);

  db.run(`DELETE FROM users`);

  db.run(`INSERT INTO users (username, password, email) VALUES ('admin', 'admin123', 'admin@email.com')`);
  db.run(`INSERT INTO users (username, password, email) VALUES ('user', 'user123', 'user@email.com')`);
});

// 🔓 Rota de login vulnerável
app.post("/login-vulnerable", (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.all(query, (err, rows) => {
    if (err) return res.status(500).send("Erro no servidor");

    if (rows.length > 0) {
      req.session.username = rows[0].username;
      res.redirect("/dashboard");
    } else {
      res.send(`
        <head>
  <meta charset="UTF-8" />
  <title>SQL Injection Demo</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #ececec;
      color: #333;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 50px auto;
      padding: 30px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    h1,
    h2 {
      color: #2c3e50;
    }

    form {
      margin-top: 20px;
    }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      margin-bottom: 15px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    button {
      background-color: #2980b9;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      background-color: #3498db;
    }

    a {
      display: inline-block;
      margin-top: 15px;
      color: #2980b9;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    #resposta {
      margin-top: 20px;
      padding: 10px;
      background-color: #ecf0f1;
      border: 1px solid #ccc;
      border-radius: 4px;
      word-wrap: break-word;
    }
  </style>
</head>
        <p>❌ Credenciais inválidas.</p>
        <p><strong>Query SQL executada:</strong><br><code>${query}</code></p>
        <a href="/">Voltar</a>
      `);
    }
  });
});

app.all("/change-password", (req, res) => {
  const newPassword = req.method === "POST" ? req.body.newPassword : req.query.newPassword;
  const username = req.session.username;

  if (!username) {
    return res.status(401).send("Você precisa estar logado");
  }

  const query = `UPDATE users SET password = '${newPassword}' WHERE username = '${username}'`;

  db.run(query, (err) => {
    if (err) return res.status(500).send("Erro no servidor");

    res.send(`Senha alterada com sucesso para ${newPassword}`);
  });
});


function escapeAttribute(str) {
  if (!str) return "";
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

app.get("/malicioso", (req, res) => {
  const name = req.session.username || "Visitante";

  db.all("SELECT username, password, email FROM users", (err, users) => {
    if (err) return res.status(500).send("Erro ao buscar usuários");

    res.send(`
      <!DOCTYPE html>
<html>

<head>
  <title>CSRF Attack</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #ececec;
      color: #333;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 50px auto;
      padding: 30px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    h1,
    h2 {
      color: #2c3e50;
    }

    form {
      margin-top: 20px;
    }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      margin-bottom: 15px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    button {
      background-color: #2980b9;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      background-color: #3498db;
    }

    a {
      display: inline-block;
      margin-top: 15px;
      color: #2980b9;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    #resposta {
      margin-top: 20px;
      padding: 10px;
      background-color: #ecf0f1;
      border: 1px solid #ccc;
      border-radius: 4px;
      word-wrap: break-word;
    }
  </style>
</head>

<body>
  <h1>Você foi hackeado 😈</h1>

  <script>
    fetch('/change-password?newPassword=senhaDoAtacante123')
      .then(response => {
        // Aqui você pode verificar o status se quiser
        window.location.href = 'about:blank';
      })
      .catch(err => {
        // Se der erro, também redirecione
        window.location.href = 'about:blank';
      });
  </script>
</body>

</html>
    `);
  });
});

app.get("/dashboard", (req, res) => {
  const name = req.session.username || "Visitante";

  // Gerar anúncios aleatórios (exemplo simples)
  const anuncios = [];
  const titulos = ["Promoção", "Oferta Especial", "Desconto", "Novidade", "Super Deal"];
  const descricoes = [
    "Compre agora e ganhe 50% de desconto!",
    "Oferta válida só até amanhã.",
    "Produto exclusivo com preço especial.",
    "Não perca essa chance única!",
    "Quantidade limitada, aproveite!"
  ];

  for (let i = 0; i < 5; i++) {
    const titulo = titulos[Math.floor(Math.random() * titulos.length)];
    const descricao = descricoes[Math.floor(Math.random() * descricoes.length)];
    const preco = (Math.random() * 100).toFixed(2);
    anuncios.push({ titulo, descricao, preco });
  }

  // Montar HTML dos anúncios
  const anunciosHTML = anuncios.map(a => `
    <a href="about:blank">
      <div class="anuncio">
        <h4>${a.titulo}</h4>
        <p>${a.descricao}</p>
        <p><strong>Preço: R$${a.preco}</strong></p>
      </div>
    </a>
  `).join("");

  db.all("SELECT username, password, email FROM users", (err, users) => {
    if (err) return res.status(500).send("Erro ao buscar usuários");

    const tabelaUsuarios = users.map(user => `
      <tr>
        <td>${user.username}</td>
        <td>${user.password}</td>
        <td>${user.email || '-'}</td>
      </tr>
    `).join("");

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fa;
            color: #2c3e50;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 40px 15px;
          }

          .container {
            background-color: #ffffff;
            max-width: 900px;
            width: 100%;
            padding: 30px 40px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
          }

          h1, h2, h3 {
            margin: 0 0 15px 0;
            font-weight: 700;
            color: #34495e;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border-radius: 8px;
            overflow: hidden;
          }

          thead {
            background-color: #2980b9;
            color: #fff;
          }

          thead th {
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            letter-spacing: 0.05em;
          }

          tbody tr {
            border-bottom: 1px solid #e1e4e8;
            transition: background-color 0.2s ease;
          }

          tbody tr:hover {
            background-color: #f0f8ff;
          }

          tbody td {
            padding: 12px 15px;
            font-size: 15px;
            color: #555;
          }

          a {
            display: inline-block;
            margin-top: 25px;
            text-decoration: none;
            font-weight: 600;
            color: #2980b9;
            transition: color 0.3s ease;
          }

          a:hover {
            color: #3498db;
            text-decoration: underline;
          }

          button {
            background-color: #2980b9;
            color: white;
            padding: 12px 24px;
            font-size: 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 20px;
            transition: background-color 0.3s ease;
            box-shadow: 0 4px 8px rgba(41, 128, 185, 0.3);
          }

          button:hover {
            background-color: #3498db;
            box-shadow: 0 6px 12px rgba(52, 152, 219, 0.5);
          }

          @media (max-width: 600px) {
            .container {
              padding: 20px 15px;
            }

            thead th, tbody td {
              padding: 10px 8px;
              font-size: 13px;
            }

            button {
              width: 100%;
              padding: 12px 0;
            }
          }

          /* Estilo dos anúncios */
          .anuncio {
            border: 1px solid #aaa;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            background-color: #f9f9f9;
          }

          .anuncio h4 {
            margin: 0 0 10px 0;
            color: #34495e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Dashboard</h1>
          <h2>Bem-vindo, ${escapeAttribute(name)}</h2>

          <h3>Usuários do sistema:</h3>
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Senha</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${tabelaUsuarios}
            </tbody>
          </table>

          ${anunciosHTML}

          <a href="/malicioso">Baixe nossa nova plicação, NÃO PERCA ESSA CHANCE!!!!</a>
          <a href="/">Sair</a>
        </div>
      </body>
      </html>
    `);
  });
});



// Rota 404
app.use((req, res) => {
  res.status(404).send("Página não encontrada");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
