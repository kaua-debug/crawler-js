const axios = require('axios'); const cheerio = require('cheerio');
const fs = require('fs')
const path = require('path')

const sites = [
    'https://www.amazon.com.br/?tag=msndesktopsta-20&hvadid=&hvpos=&hvexid={aceid}&hvnetw=o&hvrand=&hvpone=&hvptwo=&hvqmt=e&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=147008&hvtargid=kwd-71331395852319:loc-20&ref=pd_sl_4g0yu04uek_e', 
    'https://www.mercadolivre.com.br/', 
    'https://shopee.com.br/'
]

    function getDataHoraAtual() {
        const Agora = new Date()
        const Ano = Agora.getFullYear()
        const Mes = String(Agora.getMonth() +1 ).padStar(2, '0')
        const Dia = String (Agora.getDate()).padStar(2, '0')
        const horas = String(Agora.getHours()).padStar(2, '0')
        const minutos = String(Agora.getMinutes()).padStar(2, '0')

        return {
            formatoArquivo: `${Ano}-${Mes}-${Dia}_${horas}-${minutos}`,
            formatoHumano: `${dia}/${mes}/${ano} ${horas}:${minutos}`
        }
    }

            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms))
            }

            const pastaLogs = path.join(__dirname, 'logs')

                if (!fs.existsSync(pastaLogs)) {
                    fs.mkdirSync(pastaLogs)
                    console.log('Pasta de logs criada!!')
                }


                async function crawler(url) {
                    try {
                        const response = await axios.get(url)
                        const html = response.data
                        const $ =cheerio.load(html)


                        const title = $('titulo').text().trim()
                        const links = []

                        $('a').each((index, element) =>{
                            const texto =$(element).text()
                            const href = $(element).attr('href')

                            if (href) {
                                links.push({
                                    site: url,
                                    texto: texto.trim(),
                                    href: href
                                })
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
                        console.log(`❌ Erro ao acessar ${url}:`, error.message)
                        return null
                    }
                }

                async function iniciarCrawler() {
                    const axios = require('axios')
                    const cheerio = require('cheerio')
                    const fs = require('fs')
                    const path = require('path')
                    
                    const sites = [
                        'https://myaccount.mercadolivre.com.br/bookmarks/list#nav-header',
                        'https://www.google.com/search?q=jogos&oq=j&gs_lcrp=EgZjaHJvbWUqDQgCEAAYgwEYsQMYgAQyBggAEEUYOTIQCAEQLhjHARixAxjRAxiABDINCAIQABiDARixAxiABDINCAMQABiDARixAxiABDIHCAQQABiABDIHCAUQABiABDIKCAYQABixAxiABDINCAcQLhiDARixAxiABDIHCAgQABiPAjIHCAkQABiPAtIBCTE1NDEwajBqN6gCALACAA&sourceid=chrome&ie=UTF-8',
                        'https://www.google.com/search?gs_ssp=eJzj4tDP1TcwzjYuMmD0YktOLEvMyQcALh4FSA&q=cavalo&oq=cava&gs_lcrp=EgZjaHJvbWUqBwgBEC4YgAQyCQgAEEUYORiABDIHCAEQLhiABDIVCAIQLhgKGIMBGMcBGLEDGNEDGIAEMgcIAxAAGIAEMgcIBBAuGIAEMgcIBRAuGIAEMgcIBhAAGIAEMgcIBxAAGIAEMgcICBAAGI8CMgcICRAAGI8C0gEIMjk3M2owajeoAgCwAgA&sourceid=chrome&ie=UTF-8'
                    ]
                    
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
                    
                    const pastaLogs = path.join(__dirname, 'logs')
                    if (!fs.existsSync(pastaLogs)) {
                        fs.mkdirSync(pastaLogs)
                        console.log('Pasta de logs criada!!')
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
                    
                            const resultado = {
                                titulo: title,
                                site: url,
                                totalLinks: links.length,
                                links: links
                            }
                    
                            console.log(`✅ ${links.length} links encontrados em ${url}`)
                            return resultado
                    
                        } catch (error) {
                            console.log(`❌ Erro ao acessar ${url}:`, error.message)
                            return null
                        }
                    }
                    
                    async function iniciarCrawler() {
                        const todos_os_links = []
                    
                        for (let url of sites) {
                            console.log(`\n🌐 Visitando: ${url}`)
                    
                            const resultado = await crawler(url)
                    
                            if (!resultado || !resultado.links) {
                                console.log(`⚠️ Nenhum dado retornado de ${url}. Pulando.`)
                                continue
                            }
                    
                            // Adiciona os links ao array principal
                            todos_os_links.push(...resultado.links)
                    
                            //cria o nome do arquivo e salva dentro da pasta logs
                            const dataHora = getDataHoraAtual()
                            const nomeArquivo = `log_${new URL(url).hostname}_${dataHora}.json`
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
                        fs.writeFileSync('dados.json', JSON.stringify(todos_os_links, null, 2), 'utf-8')
                        console.log('\n✅ Todos os dados foram salvos em dados.json')
                    }
                    
                    iniciarCrawler()
                }