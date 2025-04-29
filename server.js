const express = require('express')
const app = express()
const port = 3001
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')
const chalk = require('chalk')

app.use(express.static('public'))
app.use(express.json())

// Endpoint para servir o arquivo JSON
app.get('/dados.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'dados.json'))
})

// Armazena as URLs que o crawler visitará
const sites = []

// Endpoint para adicionar uma URL e processar
app.post('/adicionar-site', async (req, res) => {
    const { url } = req.body

    if (!url) {
        return res.status(400).json({ mensagem: 'URL inválida' })
    }

    try {
        console.log(`🌐 Iniciando crawler para: ${url}`)
        const resultado = await crawler(url)

        if (!resultado || !resultado.links || resultado.links.length === 0) {
            return res.status(500).json({ mensagem: 'Nenhum link encontrado na página' })
        }

        // Lê os dados atuais
        let dados = []
        if (fs.existsSync('dados.json')) {
            dados = JSON.parse(fs.readFileSync('dados.json', 'utf-8'))
        }

        // Adiciona os novos links
        dados.push(...resultado.links)

        // Remove links duplicados
        const setDeLinks = new Set()
        const linksUnicos = []
        for (let link of dados) {
            const chave = `${link.site}|${link.href}`
            if (!setDeLinks.has(chave)) {
                setDeLinks.add(chave)
                linksUnicos.push(link)
            }
        }

        // Salva no dados.json
        fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8')
        console.log(chalk.green('✅ dados.json atualizado'))

        // Gera log individual
        const dataHora = getDataHoraAtual()
        const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`
        const caminhoCompleto = path.join(pastaLogs, nomeArquivo)

        resultado.dataHoraLog = dataHora.formatoHumano
        fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8')
        console.log(`📄 Log salvo em: ${caminhoCompleto}`)

        res.json({ mensagem: 'URL escaneada e dados adicionados com sucesso' })

    } catch (erro) {
        console.error(chalk.red('Erro ao processar a URL:', erro.message))
        res.status(500).json({ mensagem: 'Erro ao processar a URL' })
    }
})

// Função para obter data e hora formatadas
function getDataHoraAtual() {
    const agora = new Date()
    const ano = agora.getFullYear()
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const dia = String(agora.getDate()).padStart(2, '0')
    const horas = String(agora.getHours()).padStart(2, '0')
    const minutos = String(agora.getMinutes()).padStart(2, '0')

    return {
        formatoArquivo: `${ano}-${mes}-${dia}_${horas}-${minutos}`,
        formatoHumano: `${dia}/${mes}/${ano} ${horas}:${minutos}`
    }
}

// Função delay para esperar entre chamadas
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Cria a pasta de logs se não existir
const pastaLogs = path.join(__dirname, 'logs')
if (!fs.existsSync(pastaLogs)) {
    fs.mkdirSync(pastaLogs)
    console.log(chalk.green('📁 Pasta de logs criada'))
}

// Função principal de scraping
async function crawler(url) {
    try {
        const response = await axios.get(url)
        const html = response.data
        const $ = cheerio.load(html)

        const title = $('title').text().trim()
        const links = []

        $('a').each((index, element) => {
            const texto = $(element).text().trim()
            const href = $(element).attr('href')

            if (href) {
                links.push({
                    site: url,
                    texto,
                    href
                })
            }
        })

        console.log(`✅ ${links.length} links encontrados em ${url}`)

        return {
            titulo: title,
            site: url,
            totalLinks: links.length,
            links
        }

    } catch (error) {
        console.log(chalk.red(`❌ Erro ao acessar ${url}:`, error.message))
        return null
    }
}

// Inicia o servidor
app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`)
})
