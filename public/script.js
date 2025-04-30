function acessarDados() {
    mostrarDados();
}

function fecharDados() {
    const divConteudo = document.getElementById('conteudo');
    divConteudo.textContent = '';
}

function enviarUrl() {
    const input = document.getElementById('NovaUrl');
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
    })
    .catch(error => {
        console.error(error);
        alert('Erro ao adicionar URL');
    });
}

async function mostrarDados() {
    try {
      const res = await fetch('/dados.json');
      const contentType = res.headers.get("Content-Type");
  
      if (!res.ok) {
        throw new Error("Erro ao buscar dados.json");
      }
  
      if (!contentType.includes("application/json")) {
        throw new Error("Resposta não é JSON");
      }
  
      const dados = await res.json();
      console.log("Dados recebidos:", dados);
      // continue com a lógica de exibição...
    } catch (err) {
      console.error("Erro ao carregar dados.json:", err.message);
    }
  }