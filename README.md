# 💰 FinanceBoard — Controle Financeiro Pessoal

Projeto full-stack para controle de finanças pessoais com gráficos interativos.
Desenvolvido para portfólio com foco em clareza de código e boas práticas.

## 📁 Estrutura do projeto

```
financeboard/
├── backend/
│   ├── app.py            → Servidor Flask (API REST)
│   ├── database.py       → Lógica do banco de dados SQLite
│   ├── requirements.txt  → Dependências Python
│   └── financeboard.db   → Banco de dados (criado automaticamente)
│
└── frontend/
    ├── index.html        → Página principal
    ├── css/
    │   └── style.css     → Todos os estilos
    └── js/
        └── app.js        → Toda a lógica do frontend
```

## 🚀 Como rodar

### 1. Backend (Python)

```bash

cd backend

pip install -r requirements.txt

python app.py
```

O servidor ficará em: http://localhost:5000

### 2. Frontend

Abra o arquivo `frontend/index.html` diretamente no navegador.
Ou use a extensão **Live Server** do VS Code para abrir com clique direito.

## 🗄️ Sobre a persistência dos dados

Os dados ficam salvos no arquivo `backend/financeboard.db`.
Esse arquivo é criado automaticamente na primeira vez que você roda o servidor.
Enquanto esse arquivo existir, seus dados estarão lá — mesmo depois de fechar
o servidor, reiniciar o computador etc.

## 📡 Endpoints da API

| Método | Rota                    | O que faz                       |
|--------|-------------------------|---------------------------------|
| GET    | /api/transacoes         | Lista todas as transações        |
| POST   | /api/transacoes         | Adiciona nova transação          |
| DELETE | /api/transacoes/<id>    | Remove uma transação por ID      |
| GET    | /api/resumo             | Retorna saldo, totais e gráficos |

## 🛠️ Tecnologias

- **Python + Flask** — servidor web e API REST
- **SQLite** — banco de dados persistente (arquivo .db)
- **HTML + CSS + JavaScript** — interface do usuário
- **Chart.js** — gráficos de rosca e linha
