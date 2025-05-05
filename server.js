// server.js

const express = require('express')
const app = express()
const port = 3001
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')
const chalk = require('chalk')

// Caminho correto para o dados.json
const caminhoJSON = path.join(__dirname, 'dados.json')

// Middleware e Arquivos Estáticos
app.use(express.static('public'))
app.use(express.json())

// Envia o conteúdo do arquivo /dados.json
app.get('/dados.json', (req, res) => {
    res.sendFile(caminhoJSON)
})

const sites = []

// Cria a pasta imagens dentro de public se não existir
const pastaImagens = path.join(__dirname, 'public', 'imagens')
if (!fs.existsSync(pastaImagens)) {
    fs.mkdirSync(pastaImagens, { recursive: true })
}

// Cria a pasta logs se não existir
const pastaLogs = path.join(__dirname, 'logs')
if (!fs.existsSync(pastaLogs)) {
    fs.mkdirSync(pastaLogs)
    console.log(chalk.green('Pasta de logs criada'))
}

// Rota principal
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

        // Lê os dados já salvos no arquivo
        let dados = []
        if (fs.existsSync(caminhoJSON)) {
            dados = JSON.parse(fs.readFileSync(caminhoJSON, 'utf-8'))
        }

        // Adiciona novos links
        dados.push(...resultado.links)

        // Remove duplicados
        const setDeLinks = new Set()
        const linksUnicos = []
        for (let link of dados) {
            const chave = `${link.site}|${link.href}`
            if (!setDeLinks.has(chave)) {
                setDeLinks.add(chave)
                linksUnicos.push(link)
            }
        }

        fs.writeFileSync(caminhoJSON, JSON.stringify(linksUnicos, null, 2), 'utf-8')
        console.log(chalk.green('✅ dados.json atualizado'))

        const dataHora = getDataHoraAtual()
        const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`
        const caminhoCompleto = path.join(pastaLogs, nomeArquivo)

        resultado.dataHoraLog = dataHora.formatoHumano

        fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8')
        console.log(`📄 Log salvo em: ${caminhoCompleto}`)

        res.json({ message: 'URL escaneada e dados adicionados com sucesso' })

    } catch (erro) {
        console.error(chalk.red('Erro no /adicionar-site:', erro))
        res.status(500).json({ mensagem: 'Erro interno no servidor' })
    }
})

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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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

        const imagem = $('img').map(async (_, el) => {
            let src = $(el).attr('src')
            if (!src) return null

            const dominio = new URL(url).origin
            if (src.startsWith('/')) src = dominio + src
            else if (!src.startsWith('http')) src = `${dominio}/${src}`

            const extensao = path.extname(new URL(src).pathname).split('?')[0] || '.jpg'
            const nomeArquivo = `${Date.now()}-${Math.floor(Math.random() * 10000)}${extensao}`

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

        // Atualiza o arquivo dados.json
        let dadosExistentes = []
        if (fs.existsSync(caminhoJSON)) {
            const raw = fs.readFileSync(caminhoJSON, 'utf8')
            dadosExistentes = JSON.parse(raw)
        }
        dadosExistentes.push(...todos)
        fs.writeFileSync(caminhoJSON, JSON.stringify(dadosExistentes, null, 2))

        const resultado = {
            titulo: title,
            site: url,
            totalLinks: todos.length,
            links: todos
        }

        console.log(`✅ ${links.length} links encontrados em ${url}`)
        return resultado
    } catch (error) {
        console.log(chalk.red(`Erro ao acessar ${url}:`, error.message))
        return null
    }
}

async function baixarImagem(urlImagem, nomeArquivo) {
    const caminhoCompleto = path.join(pastaImagens, nomeArquivo)

    try {
        const response = await axios({
            method: 'GET',
            url: urlImagem,
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
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
        return null
    }
}

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
