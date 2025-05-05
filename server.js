//window

const express = require('express');
const app = express();
const port = 3001;
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');

app.use(express.static('public'));
app.use(express.json());

// Rota para servir o arquivo JSON
app.get('/dados.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'dados.json'));
});

// Verifica e cria pastas se não existirem
const pastaImagens = path.join(__dirname, 'public', 'imagens');
if (!fs.existsSync(pastaImagens)) {
  fs.mkdirSync(pastaImagens, { recursive: true });
}

const pastaLogs = path.join(__dirname, 'logs');
if (!fs.existsSync(pastaLogs)) {
  fs.mkdirSync(pastaLogs);
  console.log('📁 Pasta de logs criada!');
}

// Rota para adicionar novo site
app.post('/adicionar-site', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.error('URL inválida recebida');
    return res.status(400).json({ message: 'Url inválida' });
  }

  try {
    console.log(chalk.blue(`🌐 Iniciando crawler para: ${url}`));
    const resultado = await crawler(url);

    if (!resultado || !resultado.links || resultado.links.length === 0) {
      console.error('Nenhum link encontrado');
      return res.status(500).json({ message: 'Nenhum link encontrado na página' });
    }

    const caminhoJSON = path.join(__dirname, 'dados.json');
    let dadosAntigos = [];

    // Lê dados existentes
    if (fs.existsSync(caminhoJSON)) {
      const conteudo = fs.readFileSync(caminhoJSON, 'utf-8');
      try {
        dadosAntigos = JSON.parse(conteudo);
      } catch (e) {
        console.error('Erro ao parsear dados.json:', e);
        return res.status(500).json({ message: 'Erro ao ler dados existentes.' });
      }
    }

    // Evita duplicação (compara por href)
    const hrefsExistentes = new Set(dadosAntigos.map(item => item.href));
    const linksNovos = resultado.links.filter(item => !hrefsExistentes.has(item.href));

    const novosDados = [...dadosAntigos, ...linksNovos];

    // Salva JSON atualizado
    fs.writeFileSync(caminhoJSON, JSON.stringify(novosDados, null, 2), 'utf-8');
    console.log(chalk.green('✅ dados.json atualizado'));

    // Salva log do processo
    const dataHora = getDataHoraAtual();
    const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`;
    const caminhoLog = path.join(pastaLogs, nomeArquivo);

    resultado.dataHoraLog = dataHora.formatoHumano;
    fs.writeFileSync(caminhoLog, JSON.stringify(resultado, null, 2), 'utf-8');
    console.log(`📄 Log salvo em: ${caminhoLog}`);

    res.json({ message: 'URL escaneada e dados adicionados com sucesso' });

  } catch (erro) {
    console.error(chalk.red('Erro ao processar a requisição:', erro));
    res.status(500).json({ message: `Erro interno: ${erro.message}` });
  }
});

function getDataHoraAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');

  return {
    formatoArquivo: `${ano}-${mes}-${dia}_${horas}-${minutos}`,
    formatoHumano: `${dia}/${mes}/${ano} ${horas}:${minutos}`
  };
}

async function crawler(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text().trim();
    const links = [];
    const imagens = [];

    // Captura de links
    $('a').each((index, element) => {
      const texto = $(element).text();
      const href = $(element).attr('href');

      if (href) {
        links.push({
          site: url,
          tipo: 'link',
          texto: texto.trim(),
          href: href
        });
      }
    });

    // Captura de imagens
    const imagemPromises = $('img').map(async (_, el) => {
      let src = $(el).attr('src');
      if (!src) return null;

      const dominio = new URL(url).origin;
      if (src.startsWith('/')) src = dominio + src;
      else if (!src.startsWith('http')) src = `${dominio}/${src}`;

      const extensao = path.extname(new URL(src).pathname).split('?')[0] || '.jpg';
      const nomeArquivo = `${Date.now()}-${Math.floor(Math.random() * 10000)}${extensao}`;
      const caminhoLocal = await baixarImagem(src, nomeArquivo);

      if (caminhoLocal) {
        return {
          site: url,
          tipo: 'img',
          texto: '',
          href: caminhoLocal
        };
      }
      return null;
    }).get();

    const imagensBaixadas = (await Promise.all(imagemPromises)).filter(Boolean);

    const todos = [...links, ...imagensBaixadas];

    const resultado = {
      titulo: title,
      site: url,
      totalLinks: todos.length,
      links: todos
    };

    console.log(chalk.green(`✅ ${links.length} links e ${imagensBaixadas.length} imagens encontrados em ${url}`));
    return resultado;

  } catch (error) {
    console.log(chalk.red(`Erro ao acessar ${url}:`, error.message));
    return null;
  }
}

async function baixarImagem(urlImagem, nomeArquivo) {
  const caminhoCompleto = path.join(pastaImagens, nomeArquivo);

  try {
    const response = await axios({
      method: 'GET',
      url: urlImagem,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(caminhoCompleto);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return `/imagens/${nomeArquivo}`;
  } catch (error) {
    console.error(chalk.red(`Erro ao baixar a imagem ${urlImagem}: ${error.message}`));
    return null;
  }
}

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
