// Função para validar a URL
function validarUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Função para enviar a URL
function enviarUrl() {
    const input = document.getElementById('novaUrl');
    const url = input ? input.value.trim() : '';

    if (!url || !validarUrl(url)) {
        alert("Por favor, insira uma URL válida");
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
        alert(data.mensagem || 'URL adicionada com sucesso');

        // Limpar o campo de input
        if (input) input.value = '';

        // Atualizar os dados no seletor de sites
        atualizarDados();
    })
    .catch(err => {
        console.error(err);
        alert('Erro ao adicionar URL. Tente novamente.');
    });
}

// Função para atualizar dados e preencher o seletor
function atualizarDados() {
    fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            todosOsDados = dados;
            const seletor = document.getElementById('seletorDeSites');
            if (seletor) {
                seletor.innerHTML = '<option value="">Escolha um site</option>'; // Limpar o select
                preencherSeletorDeSites(); // Atualizar o seletor com os dados
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao carregar os dados.');
        });
}

// Função para mostrar dados agrupados por site
function mostrarDados() {
    const conteudo = document.getElementById('conteudo');
    if (!conteudo) return; // Verifica se o elemento existe

    // Exibição de indicador de carregamento
    conteudo.innerHTML = 'Carregando dados...';

    fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            conteudo.innerHTML = '';
            const porSite = {};

            dados.forEach(item => {
                if (!porSite[item.site]) porSite[item.site] = [];
                porSite[item.site].push(item);
            });

            Object.entries(porSite).forEach(([site, links]) => {
                const bloco = document.createElement('div');
                bloco.className = 'site';

                const titulo = document.createElement('h2');
                titulo.innerText = site;
                bloco.appendChild(titulo);

                links.forEach(link => {
                    const linha = document.createElement('div');
                    linha.className = 'link';

                    if (link.tipo === 'img') { // Verifica se é imagem
                        const img = document.createElement('img');
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

                    bloco.appendChild(linha);
                });

                conteudo.appendChild(bloco);
            });
        })
        .catch(err => {
            if (conteudo) conteudo.innerHTML = 'Erro ao carregar os dados';
            console.error(err);
        });
}

function fecharDados() {
    // O que deve acontecer quando o botão for clicado
    const dadosDiv = document.getElementById('dados'); // exemplo de elemento a ser ocultado
    if (dadosDiv) {
      dadosDiv.style.display = 'none'; // Oculta o elemento com id "dados"
    }
  }
  



// Função para preencher o seletor de sites
function preencherSeletorDeSites() {
    const seletor = document.getElementById('seletorDeSites');
    if (!seletor) return; // Verificar se o seletor existe

    const sitesUnicos = [...new Set(todosOsDados.map(item => item.site))];

    sitesUnicos.forEach(site => {
        const option = document.createElement('option');
        option.value = site;
        option.innerText = site;
        seletor.appendChild(option);
    });
}
