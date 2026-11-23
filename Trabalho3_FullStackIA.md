# Trabalho #3 – Uso das IAs no desenvolvimento de Projetos Full Stack

**Instituição:** Centro Universitário UniSenac – Campus Pelotas  
**Curso:** Tecnologia em Análise e Desenvolvimento de Sistemas  
**Disciplina:** Programação Full Stack – Prof. Edécio Fernando Iepsen  
**Data da Apresentação:** 26/11/2026  
**Tema Escolhido:** Sistema para Controle de Salão de Beleza (**BelleVie Studio**)

---

## 1. Inteligência Artificial Utilizada

Para auxiliar no desenvolvimento de pontos específicos do projeto, utilizamos o **ChatGPT (OpenAI)** como ferramenta de apoio e consulta durante a programação.

O objetivo foi desenvolver a estrutura principal do sistema seguindo o padrão trabalhado nas aulas (**Node.js + Express + Prisma ORM com SQLite** no Back-end e **React + Vite + Tailwind CSS** no Front-end) e usar o ChatGPT pontualmente para agilizar regras de negócio, consultas relacionais do Prisma e componentes visuais da interface.

---

## 2. Principais Prompts Utilizados e o que a IA Gerou

Abaixo estão os **3 prompts-chave** que passamos para o ChatGPT durante a construção do sistema e como aproveitamos o retorno dele:

### Prompt 1 – Modelagem do Banco e Relacionamentos no Prisma
> *"Estou criando um sistema de controle para Salão de Beleza usando Node.js, Express e Prisma com SQLite. Me ajuda a montar o schema.prisma relacionando Clientes, Serviços, Profissionais e Agendamentos, onde cada agendamento guarda a data, horário, status (AGENDADO, CONCLUIDO, CANCELADO) e valor cobrado."*

- **O que a IA entregou bem:** Gerou os 4 models (`Cliente`, `Servico`, `Profissional` e `Agendamento`) já com as chaves estrangeiras (`clienteId`, `servicoId`, `profissionalId`) e o `onDelete: Cascade` para evitar erros de integridade ao excluir um cliente.

### Prompt 2 – Regra de Negócio: Validação de Conflito de Horário na API
> *"Na rota POST /api/agendamentos do Express com Prisma, como faço uma validação antes de salvar para impedir que o mesmo profissional seja agendado duas vezes na mesma data e no mesmo horário, ignorando agendamentos cancelados?"*

- **O que a IA entregou bem:** Sugeriu o uso do `prisma.agendamento.findFirst` filtrando por `data`, `horario`, `profissionalId` e `status: { not: 'CANCELADO' }`, retornando status HTTP `409 (Conflict)` com uma mensagem amigável caso o horário já esteja ocupado.

### Prompt 3 – Dashboard Financeiro e Preenchimento Automático no React
> *"No React, quero que ao selecionar um serviço no `<select>` do formulário de agendamento, o campo de 'Valor Cobrado' já seja preenchido automaticamente com o preço daquele serviço, mas continue editável caso tenha desconto. Também preciso de um endpoint de resumo que some o total faturado (concluídos) e o valor a receber (agendados)."*

- **O que a IA entregou bem:** Criou a função `aoSelecionarServico` no estado do formulário do React e a lógica com `.reduce()` na rota `/api/dashboard` para somar os valores separados por status.

---

## 3. Análise do Código (Pontos de Destaque para Mostrar na Apresentação)

1. **Modelagem Relacional ([schema.prisma](file:///c:/Users/Win11/OneDrive/Área%20de%20Trabalho/imobi%20trabalho/server/prisma/schema.prisma)):**
   - Uso do `@relation` ligando a tabela `agendamentos` às tabelas `clientes`, `servicos` e `profissionais`.
2. **Consultas com `include` e `_count` ([server/index.js](file:///c:/Users/Win11/OneDrive/Área%20de%20Trabalho/imobi%20trabalho/server/index.js)):**
   - Nas listagens, o Prisma já traz os dados completos do cliente, serviço e profissional (`include: { cliente: true, servico: true, profissional: true }`) e conta quantos atendimentos cada cliente/profissional possui (`_count`).
3. **Interface Reativa ([client/src/App.jsx](file:///c:/Users/Win11/OneDrive/Área%20de%20Trabalho/imobi%20trabalho/client/src/App.jsx)):**
   - Controle de abas (Agenda & Caixa, Clientes, Serviços, Profissionais), cards de resumo financeiro no topo e filtros dinâmicos por data e status.

---

## 4. Testes Realizados: O que Funcionou vs. Problemas Encontrados

### O que funcionou corretamente de primeira:
- **CRUD completo e relacionamentos:** Cadastro e listagem de clientes, catálogo de serviços, equipe de profissionais e agendamentos.
- **Bloqueio de choque de horário:** Ao tentar marcar dois clientes no mesmo dia e horário com a mesma profissional, a API bloqueia corretamente e exibe o alerta na tela.
- **Cálculo automático do caixa:** Ao clicar em **"Concluir"** em um agendamento, o valor sai imediatamente de *"A Receber"* e soma no card de *"Faturamento Recebido"*.

### Problemas encontrados com o código da IA e como corrigimos:
1. **Tipagem de números vindos do formulário (`String` vs `Number`):**
   - *Problema:* Nas primeiras respostas do ChatGPT, os campos `clienteId`, `preco` e `valorCobrado` enviados pelo formulário React chegavam como `String` no Express, e o Prisma retornava erro de validação de tipo (`Int` / `Float` esperado).
   - *Como corrigimos:* Adicionamos a conversão explícita com `Number(...)` no Back-end antes de passar os dados para o `prisma.create()`.
2. **Exclusão de Serviço ou Profissional com agendamentos vinculados:**
   - *Problema:* Quando tentávamos excluir um serviço que já tinha histórico na agenda, o banco retornava erro de chave estrangeira (`Foreign Key Constraint`).
   - *Como corrigimos:* Envolvemos o `delete` em um bloco `try/catch` personalizado na API retornando uma mensagem clara para o usuário no Front-end explicando que não é possível excluir um serviço/profissional que possui agendamentos vinculados.

---

## 5. Como Executar o Projeto Localmente

### 1. Back-end (Porta 3001)
```bash
cd server
npm install
npx prisma db push
npm run seed
npm run dev
```

### 2. Front-end (Porta 5173)
```bash
cd client
npm install
npm run dev
```
