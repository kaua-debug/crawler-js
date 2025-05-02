// server.js

const express = require('express');
const app = express();
const port = 3001;
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');
const { match } = require('assert');

app.use(express.static('public'));
app.use(express.json());

app.get('/dados.json', (req, res) => {
  res.sendFile(path.join(__dirname, '/dados.json'));
});

const sites = [];

const pastaImagens = path.join(__dirname, 'public', 'imagens')
if (!fs.existsSync(pastaImagens)) {
  fs.mkdirSync(pastaImagens, { recursive: true })
}

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

    // Captura de links
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

    const imagem = $('img').map(async (_, el)=> {
      let src = $(el).attr('src')
      if (!src) return null
      
        const dominio = new URL (url).origin
        if (src.startsWith('/')) src = dominio + src
        else if (!src.startsWith('http')) src = `${dominio}/${src}`

        const extensao = path.extname(new URL(src).pathname).aplit('?')[0] || '.jpg'
        const nomeArquivo = `${Date.now()}-${match.floor(Math.random() * 10000)} ${extensao}`
        const caminhoLocal = await baixarImagem(src, nomeArquivo)

        if (caminhoLocal) {
          return {

            site: url,
            tipo: 'img',
            href: caminhoLocal, 
            text: ''

          }
        }

        return null

    }).get()

    const imagensBaixadas = (await Promise.all(imagem)).filter(Boolean)

    const todos = [...links, ...imagensBaixadas]

    //salvar no arquivo json

    const caminhoJSON = path.join(__dirname, 'dados.json')
    let dadosExistentes = []
    if (fs.existsSync(caminhoJSON)) {
      const raw = fs.readFileSync(caminhoJSON, 'utf-8')
      dadosExistentes = JSON.parse(raw)
    }

    dadosExistentes.push(...todos)
    fs.writeFileSync(caminhoJSON, JSON.stringify(dadosExistentes, null, 2))

    // Captura de imagens
   /* const imagem =$('img').each((_, el) => {
      let src = $(el).attr('src');
      if (!src ) {
        const base = new URL(url);
        src = new URL(src, base).href;
      }
      const alt = $(el).attr('alt') || '';

      if (src && src.startsWith('http')) {
        imagens.push({
          site: url,
          href: src,
          texto: alt
        });

        // Adiciona também na lista de links, se necessário
        links.push({
          site: url,
          href: src,
          texto: 'Imagem',
          tipo: 'img'
        });
      }
    });*/

    const resultado = {
      titulo: title,
      site: url,
      totalLinks: todos.length,
      links: todos
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

  const linksUnicos = [];
  const setDeLinks = new Set();

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

async function baixarImagem(urlImagem, nomeArquivo) {
  const caminhoCompleto = path.join(pastaImagens, nomeArquivo)

  try {
    const response = await axios({
        method: 'GET',
        url: urlImagem,
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    })

    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(caminhoCompleto)
        response.data.pipe(writer)
        writer.on('finish', resolve)
        writer.on('error', reject)
    })

    return `/imagens/${nomeArquivo}`
} catch (error) {
    console.error(chalk.red(`Erro ao baixar a imagem ${urlImagem}: ${error.message}`))
    if (error.response) {
        console.error(`Status: ${error.response.status}`)
        console.error(`Resposta: ${error.response.data}`)
    }
}
}



app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
