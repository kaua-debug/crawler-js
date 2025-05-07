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
    .catch(error => {
        console.error(error)
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

window.addEventListener('DOMContentLoaded', () => {
    // Tentar buscar os dados ao carregar a página
    fetch('/dados.json')
        .then(res => {
            // Verifica se a resposta foi bem-sucedida
            if (!res.ok) {
                // Exibe um erro caso a resposta não seja OK (por exemplo, 404 ou 500)
                throw new Error(`Erro na requisição: ${res.status} - ${res.statusText}`);
            }
            // Tenta converter a resposta para JSON
            return res.json();
        })
        .then(dados => {
            // Caso a resposta seja um JSON válido, preenche os dados
            todosOsDados = dados;
            preencherSeletorDeSites();  // Atualiza o seletor de sites com os dados
        })
        .catch(error => {
            // Caso haja erro, exibe no console e alerta o usuário
            console.error('Erro ao carregar dados.json:', error);
            alert('Não foi possível carregar os dados. Verifique se o servidor está funcionando corretamente.');
        });
});


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

/*function preencherSeletorDeImagens() {
    const seletor = document.getElementById('seletorDeImagens')
    seletor.innerHTML = '<option value="">Escolha um site</option>'

    const sitesUnicos = [...new Set(todosOsDados
        .filter(item => item.tipo === 'img')
        .map(item => item.site)
    )]

    sitesUnicos.forEach(site => {
        const option = document.createElement('option')
        option.value = site
        option.innerText = site
        seletor.appendChild(option)
    })*/


   function mostrarImagensPorSite() {

        const siteSelecionado = document.getElementById('seletorDeImagens').value
        const lista = document.getElementById('ImagensColetadas')
        lista.innerHTML = ''

        if (!siteSelecionado) return

        const imagens = todosOsDados.filter(item => item.site === siteSelecionado && item.tipo === 'img')


        imagens.forEach(img => {
            const li = document.createElement('li')
            const imagem = document.createElement('img')
            imagem.src = img.href
            imagem.alt = img.texto || 'imagem'
            imagem.style.maxWidth = '200px'
            imagem.style.marginBottom = '10px'
            li.appendChild(imagem)
            lista.appendChild(li)
        })

    }

            //Soetor do modal

            document.getElementById('abrirModal').onclick = () => {
                document.getElementById('modal').style.display = 'block'
                carregarSites()
            }

            document.getElementById('fecharModal').onclick = () => {
                document.getElementById('modal').attributeStyleMap.display = 'none'
            }

            document.getElementById("filtroSites").oninput = function () {
                const filtro = this.value.toLowerCase()
                const itens = document.querySelectorAll('#listaSites li')
                itens.forEach(item => {
                    const texto = item.textContent.toLowerCase()
                    item.style.display = texto.includes(filtro) ? 'flex' : 'none'
                })
            }

            async function carregarSites() {
                const res = await fetch('/dados.json')
                const dados = await res.json()


                const sitesUnicos = [...new Set(dados.map(d => d.site))]

                const lista = document.getElementById('listaSites')
                lista.innerHTML = '' //limpa antes de popular 

                sitesUnicos.forEach(site => {
                    const li = document.createElement('li')
                    li.innerHTML = `
                        <span>${site}</span>
                        <button onclick="excluirSite('${site}')">Excluir</button>
                    `;
                    lista.appendChild(li)
                
                })
            
            }
        function excluirSite() {
            const siteSelecionado = document.getElementById('seletorDeSites').value

            if (!siteSelecionado) {
                alert('selecione um site para excluir')
                return
            }

            if(!confirm(`Tem certeza de que deseja excluir esses sites '${siteSelecionado}'?` )) return

            fetch('/excluir-site', {
                method: 'DELETE',
                headers: {
                   'Content-Type': 'application/json' 
                }, 
                body: JSON.stringify ({ site: siteSelecionado})
            })
            .then(res => res.json())
            .then(data => {
                alert(data.mensagem || 'site excluido com sucesso')

                //Atualiza os dados exibidos
                
                
                todosOsDados = todosOsDados.filter(item => item.site !== siteSelecionado)
                preencherSeletorDeSites()
                fecharDados()
            })

            .catch(eror => {
                console.error(eror)
                alert('Erro ao excluir site')
            })

        }