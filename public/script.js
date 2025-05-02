// Função para fechar os dados
function fecharDados() {
    const divConteudo = document.getElementById('conteudo');
    divConteudo.textContent = '';
}

// Função para enviar uma nova URL
function enviarUrl() {
    const input = document.getElementById('input-url');
    const url = input.value.trim();

    if (!url) {
        alert('Por favor, insira uma URL válida');
        return;
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
        alert(data.message || 'URL adicionada com sucesso');
    
        // Recarrega os novos sites
        fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            todosOsDados = dados;
            const seletor = document.getElementById('selectSites');
            seletor.innerHTML = '<option value="">Escolha um site</option>';
            preencherSeletorDeSites(dados); // Preenche o seletor com os novos dados
        });
    })
    .catch(error => {
        console.error(error);
        alert('Erro ao adicionar URL');
    });
}


// Função para mostrar os dados
function mostrarDados() {
    const conteudo = document.getElementById('conteudo');
    
    // Verifique se o elemento #conteudo existe
    if (!conteudo) {
        console.error('Elemento #conteudo não encontrado!');
        return;
    }

    fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            conteudo.innerHTML = ''; // Limpa o conteúdo anterior
            const porSite = {};

            // Agrupar links por site
            dados.forEach(item => {
                if (!porSite[item.site]) porSite[item.site] = [];
                porSite[item.site].push(item);
            });

            // Criar blocos por site
            Object.entries(porSite).forEach(([site, links]) => {
                const bloco = document.createElement('div');
                bloco.className = 'site';

                const titulo = document.createElement('h2');
                titulo.innerText = site;
                bloco.appendChild(titulo);

                links.forEach(link => {
                    const linha = document.createElement('div');
                    linha.className = 'link';

                    if (link.tipo === 'img') { //verifica se é imagem pu se é link derebius
                        const img = document.createElement('img')
                        img.src = link.href
                        img.alt =link.texto || 'imagem'
                        img.style.maxWidth = '200px'
                        img.style.marginTop = '8px'
                        linha.appendChild(img)

                    } else {
                        
                 const a = document.createElement('a');
                 linha.appendChild(a);
                 a.href = link.href;
                 a.target = '_blank';
                 a.innerText = link.href;

                    }
                    bloco.appendChild(linha);
                });

                conteudo.appendChild(bloco);
            });
        })
        .catch(err => {
            document.getElementById('conteudo').innerHTML = 'Erro ao carregar os dados';
            console.error(err);
        });
    }

    let todosOsDados = []


    //Carrega os dados quando o usuario acessar a pagina

window.addEventListener('DOMContentLoaded', () => {
    fetch('/dados.json')
    .then(res => res.json())
    .then(dados => {
        todosOsDados = dados
        preencherSeletorDeSites()
    })
    .catch(error => {
        console.error(error)
    })
})


    function preencherSeletorDeSites(dados) {
        const seletor = document.getElementById('selectSites');
    
        // Verifica se o seletor existe
        if (!seletor) {
            console.error('Elemento #selectSites não encontrado!');
            return;
        }
    
        // Preenche as opções no seletor com os dados recebidos
        dados.forEach(item => {
            const option = document.createElement('option');
            option.value = item.href;
            option.innerText = item.site;
            seletor.appendChild(option);
        });
    }

    function mostrarLinksPorSites() {
        const seletor = document.getElementById('seletorDeSites').value
        const lista = document.getElementById('linksColetados')
        lista.innerHTML = ''

        if (!siteSelecionado) return

        const links = todosOsDados.filter(item => item.site === siteSelecionado)

        links.forEach(link => {
            const li = document.createElement('li')
            const a = document.createElement('a')
            a.href = link.href
            a.target = '_blank'
            a.innerText = link.texto || link.href
            li.appendChild(a)
            lista.appendChild(li)
        })
    }

