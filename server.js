//server.js

const express = require('express');
const app = express();
const port = 3001;
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');

app.use(express.static('public'));

  app.get('/dados.json', (req, res) => {
    res.sandFile(path.join(__dirname + '/dados.json'))
  })

app.use(express.json());

const sites = [];

app.post('/adicionar-site', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'Url inválida' });
  }

  //Carregar o array atual de sites

  try {
    console.log(chalk.blue(`🌐 Iniciando crawler para: ${url}`));
    const resultado = await crawler(url);

    if (!resultado || !resultado.links || resultado.links.length === 0) {
      return res.status(500).json({ message: 'Nenhum link encontrado na página' });
    }

    //aqui le os dados atuais

    let dados = [];
    if (fs.existsSync('dados.json')) {
      dados = JSON.parse(fs.readFileSync('dados.json', 'utf-8'));
    }

    dados.push(...resultado.links);

    //remove links duplicados

    const setDeLinks = new Set();
    const linksUnicos = [];

    for (let link of dados) {
      const chave = `${link.site}|${link.href}`;
      if (!setDeLinks.has(chave)) {
        setDeLinks.add(chave);
        linksUnicos.push(link);
      }
    }

    
    fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8')
    console.log(chalk.green('✅ dados.json atualizado'))
    
    //Salva o log dessa pagina´individualmente

    const dataHora = getDataHoraAtual();
    const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`;
    const caminhoCompleto = path.join(pastaLogs, nomeArquivo);

    
    resultado.dataHoraLog = dataHora.formatoHumano;

    fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8');
    console.log(`📄 Log salvo em: ${caminhoCompleto}`);

    res.json({ message: 'URl escaneada e dados adicionados com sucesso' })

  } catch (erro) {
      console.error(chalk.red('Erro ao ler dados.json:', erro))
  }
})

    //verifica se o site ja existe

    /*const indexSite = dados.findIndex(site => site,site === url)

    if (indexSite <= 0) {
      // se existir atualiza os dados do site
      dados[indexSite] = resultado
    } else {
      // se não existir adiciona o novo site
      dados.push(resultado)
    }*/

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
          const response = await axios.get(url)
          const html = response.data
          const $ = cheerio.load(html)
  
          const title = $('title').text().trim()
          const links = []
  
          $('a').each((index, element) => {
              const texto = $(element).text()
              const href = $(element).attr('href')
  
              if (href) {
                  links.push({
                      site: url,
                      texto: texto.trim(),
                      href: href
                  })
              }
          })
  
          $('img').each((_, el) => {
              let src = $(el).attr('src')
              if (src && !src.startWith('http')) {
                  // convertendo caminhos relativos em absoluto
                  const base = new URL(url)
                  src = new URL(src, base).href;
              }
          })
  
          const resultado = {
              titulo: title,
              site: url,
              totalLinks: links.length,
              links: links
          }
  
          console.log(`✅ ${links.length} links encontrados em ${url}`)
          return resultado
      } catch (error) {
          console.log(chalk.red(`Erro ao acessar ${url}:`, error.message))
          return null
      }
    }
    
    async function iniciarCrawler() {
      const todos_os_links = []
      
      for (let url of sites) {
        console.log(`\n🌐 Visitando: ${url}`)
        
        const resultado = await crawler(url)
        
        if (!resultado || !resultado.links) {
          console.log(chalk.yellow(`⚠️ Nenhum dado retornado de ${url}. Pulando.`))
          continue
        }
        
        // Adiciona os links ao array principal
        todos_os_links.push(...resultado.links)
        
        //cria o nome do arquivo e salva dentro da pasta logs
        const dataHora = getDataHoraAtual()
        const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`
        const caminhoCompleto = path.join(pastaLogs, nomeArquivo)
        
        resultado.dataHoraLog = dataHora.formatoHumano
        
        fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8')
        
      console.log(`📄 Log salvo em: ${caminhoCompleto}`)

      // Espera 2 segundos para evitar bloqueios
      await delay(2000)
    }
    
    const linksUnicos = []
    const setDeLinks = new Set()
    
  for (let link of todos_os_links) {
    const chave = `${link.site}|${link.href}` //identificador unico
    if (!setDeLinks.has(chave)) {
          setDeLinks.add(chave)
          linksUnicos.push(link)
        }
      }

  // Salva todos os dados encontrados juntos
  fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8')
  console.log(chalk.green('\n✅ Todos os dados foram salvos em dados.json'))
}


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})






app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});

/* fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8');

 sites.push(url);
 
 res.status(200).json({ message: 'Site adicionado com sucesso', totalLinks: resultado.links.length });
} catch (error) {
  console.error(chalk.red(`❌ Erro ao processar o site: ${error.message}`));
  res.status(500).json({ message: 'Erro interno do servidor' });
}
});*/


// Atualiza ou adiciona o resultado no array
/* const indexSite = dados.findIndex(site => site.site === url);
if (indexSite >= 0) {
  dados[indexSite] = resultado;
    } else {
      dados.push(resultado);
    }
    
    await delay(2000);
  }*/

 /*fs.writeFileSync('dados.json', JSON.stringify(dados, null, 2), 'utf-8');
 console.log('\n✅ Todos os dados foram salvos agrupados por site em dados.json');
}*/