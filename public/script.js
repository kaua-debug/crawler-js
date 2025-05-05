//script.js
function acessarDados() {
    mostrarDados()
}

function fecharDados() {
    const divConteudo = document.getElementById('conteudo')
    divConteudo.textContent = ''
}

function enviarUrl() {

    const input = document.getElementById('novaUrl')
    const url = input.value.trim()

    if (!url) {
        alert("Por favor, isira uma url valida")
        return
    }

    fetch('/adicionar-site', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensagem || 'URl adicionada com sucesso')

        //aqui vai recarregar os novos dados(urls) 
        fetch('/dados.json')
            .then(res => res.json())
            .then(dados => {
                todosOsDados = dados
                const seletor = document.getElementById('seletorDeSites')
                seletor.innerHTML = '<option value = "">Escolha um site</option>' //limpar o select
                preencherSeletorDeSites()
            })
    })
    .catch(err => {
        console.error(err)
        alert('Erro ao adicionar URL:')
    })
}

function mostrarDados() {
    fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            const conteudo = document.getElementById('conteudo')
            conteudo.innerHTML = ''
            const porSite = {}

            // Agrupar links por site
            dados.forEach(item => {
                if (!porSite[item.site]) porSite[item.site] = []
                porSite[item.site].push(item)
            });

            // Criar blocos por site 
            Object.entries(porSite).forEach(([site, links]) => {
                const bloco = document.createElement('div')
                bloco.className = 'site'

                const titulo = document.createElement('h2')
                titulo.innerText = site
                bloco.appendChild(titulo)

                links.forEach(link => {
                    const linha = document.createElement('div')
                    linha.className = 'link'

                    if (link.tipo === 'img') { //verifica se é imagem ou se link no site visitado bb
                        const img = document.createElement('img')
                        img.src = link.href;
                        img.alt = link.texto || 'Imagem';
                        img.style.maxWidth = '200px';
                        img.style.marginTop = '8px';
                        linha.appendChild(img);
                    } else {
                        const a = document.createElement('a');
                        a.href = link.href;
                        a.target = '_blank';
                        a.innerText = link.texto || link.href;
                        linha.appendChild(a);
                    }

                    bloco.appendChild(linha)
                })

                conteudo.appendChild(bloco)
            })
        })
        .catch(err => {
            document.getElementById('conteudo').innerHTML = 'Erro ao carregar os dados'
            console.error(err)
        })
}

let todosOsDados = []

//carregar os dados quando o usuario acessar a pagina
window.addEventListener('DOMContentLoaded', () => {
    fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            todosOsDados = dados
            preencherSeletorDeSites()
        })
        .catch(err => {
            console.error(err)
        })
})

function preencherSeletorDeSites() {
    const seletor = document.getElementById('seletorDeSites')
    const sitesUnicos = [...new Set(todosOsDados.map(item => item.site))]

    sitesUnicos.forEach(site => {
        const option = document.createElement('option')
        option.value = site
        option.innerText = site
        seletor.appendChild(option)
    })
}

function mostrarLinksPorSite() {
    const siteSelecionado = document.getElementById('seletorDeSites').value
    const lista = document.getElementById('linksColetados')
    lista.innerHTML = ''

    if (!siteSelecionado) return

    const links = todosOsDados.filter(item => item.site === siteSelecionado)

    links.forEach(link =>{
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.href = link.href
        a.target = '_blank'
        a.innerText = link.texto || link.href
        li.appendChild(a)
        lista.appendChild(li) 
    })
}