// server.js

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

app.get('/dados.json', (req, res) => {
  res.sendFile(path.join(__dirname, '/dados.json'));
});

const sites = [];

app.post('/adicionar-site', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'Url inválida' });
  }

  try {
    console.log(chalk.blue(`🌐 Iniciando crawler para: ${url}`));
    const resultado = await crawler(url);

    if (!resultado || !resultado.links || resultado.links.length === 0) {
      return res.status(500).json({ message: 'Nenhum link encontrado na página' });
    }

    let dados = [];
    if (fs.existsSync('dados.json')) {
      dados = JSON.parse(fs.readFileSync('dados.json', 'utf-8'));
    }

    dados.push(...resultado.links);

    const setDeLinks = new Set();
    const linksUnicos = [];

    for (let link of dados) {
      const chave = `${link.site}|${link.href}`;
      if (!setDeLinks.has(chave)) {
        setDeLinks.add(chave);
        linksUnicos.push(link);
      }
    }

    fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8');
    console.log(chalk.green('✅ dados.json atualizado'));

    const dataHora = getDataHoraAtual();
    const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`;
    const caminhoCompleto = path.join(pastaLogs, nomeArquivo);

    resultado.dataHoraLog = dataHora.formatoHumano;

    fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8');
    console.log(`📄 Log salvo em: ${caminhoCompleto}`);

    res.json({ message: 'URL escaneada e dados adicionados com sucesso' });

  } catch (erro) {
    console.error(chalk.red('Erro ao processar:', erro));
    res.status(500).json({ message: 'Erro interno ao processar o site.' });
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const pastaLogs = path.join(__dirname, 'logs');
if (!fs.existsSync(pastaLogs)) {
  fs.mkdirSync(pastaLogs);
  console.log('📁 Pasta de logs criada!');
}

async function crawler(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text().trim();
    const links = [];
    const imagens = [];

    $('a').each((index, element) => {
      const texto = $(element).text();
      const href = $(element).attr('href');

      if (href) {
        links.push({
          site: url,
          texto: texto.trim(),
          href: href
        });
      }
    });

    $('img').each((_, el) => {
      let src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';

      if (src && !src.startsWith('http')) {
        const base = new URL(url);
        src = new URL(src, base).href;
      }

      if (src) {
        imagens.push({
          site: url,
          src: src,
          alt: alt.trim()
        });
      }
    });

    const resultado = {
      titulo: title,
      site: url,
      totalLinks: links.length,
      totalImagens: imagens.length,
      links: links,
      imagens: imagens
    };

    console.log(chalk.green(`✅ ${links.length} links e ${imagens.length} imagens encontrados em ${url}`));
    return resultado;

  } catch (error) {
    console.log(chalk.red(`Erro ao acessar ${url}:`, error.message));
    return null;
  }
}

async function iniciarCrawler() {
  const todos_os_links = [];

  for (let url of sites) {
    console.log(`\n🌐 Visitando: ${url}`);

    const resultado = await crawler(url);

    if (!resultado || !resultado.links) {
      console.log(chalk.yellow(`⚠️ Nenhum dado retornado de ${url}. Pulando.`));
      continue;
    }

    todos_os_links.push(...resultado.links);

    const dataHora = getDataHoraAtual();
    const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`;
    const caminhoCompleto = path.join(pastaLogs, nomeArquivo);

    resultado.dataHoraLog = dataHora.formatoHumano;

    fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8');
    console.log(`📄 Log salvo em: ${caminhoCompleto}`);

    await delay(2000);
  }

  const setDeLinks = new Set();
  const linksUnicos = [];

  for (let link of todos_os_links) {
    const chave = `${link.site}|${link.href}`;
    if (!setDeLinks.has(chave)) {
      setDeLinks.add(chave);
      linksUnicos.push(link);
    }
  }

  fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8');
  console.log(chalk.green('\n✅ Todos os dados foram salvos em dados.json'));
}

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
