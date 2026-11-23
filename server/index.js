const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==================== DASHBOARD / RESUMO ====================
app.get('/api/dashboard', async (req, res) => {
  try {
    const [totalClientes, totalServicos, totalProfissionais, agendamentos] = await Promise.all([
      prisma.cliente.count(),
      prisma.servico.count({ where: { ativo: true } }),
      prisma.profissional.count(),
      prisma.agendamento.findMany({
        include: {
          cliente: true,
          servico: true,
          profissional: true
        },
        orderBy: [{ data: 'asc' }, { horario: 'asc' }]
      })
    ]);

    const concluidos = agendamentos.filter((a) => a.status === 'CONCLUIDO');
    const pendentes = agendamentos.filter((a) => a.status === 'AGENDADO');
    const faturamentoTotal = concluidos.reduce((acc, item) => acc + Number(item.valorCobrado || 0), 0);
    const faturamentoPrevisto = pendentes.reduce((acc, item) => acc + Number(item.valorCobrado || 0), 0);

    res.json({
      totalClientes,
      totalServicos,
      totalProfissionais,
      totalAgendamentos: agendamentos.length,
      agendamentosPendentes: pendentes.length,
      agendamentosConcluidos: concluidos.length,
      faturamentoTotal,
      faturamentoPrevisto
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar dados do dashboard', detalhes: error.message });
  }
});

// ==================== CLIENTES ====================
app.get('/api/clientes', async (req, res) => {
  try {
    const { busca } = req.query;
    const where = busca
      ? {
          OR: [
            { nome: { contains: String(busca) } },
            { telefone: { contains: String(busca) } },
            { email: { contains: String(busca) } }
          ]
        }
      : {};

    const clientes = await prisma.cliente.findMany({
      where,
      include: { _count: { select: { agendamentos: true } } },
      orderBy: { nome: 'asc' }
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar clientes', detalhes: error.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, telefone, email, observacoes } = req.body;
    if (!nome || !telefone) {
      return res.status(400).json({ erro: 'Nome e telefone são obrigatórios.' });
    }
    const novo = await prisma.cliente.create({
      data: { nome, telefone, email: email || null, observacoes: observacoes || null }
    });
    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar cliente', detalhes: error.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nome, telefone, email, observacoes } = req.body;
    const atualizado = await prisma.cliente.update({
      where: { id },
      data: { nome, telefone, email, observacoes }
    });
    res.json(atualizado);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao atualizar cliente', detalhes: error.message });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.cliente.delete({ where: { id } });
    res.json({ mensagem: 'Cliente removido com sucesso.' });
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao excluir cliente', detalhes: error.message });
  }
});

// ==================== SERVIÇOS ====================
app.get('/api/servicos', async (req, res) => {
  try {
    const servicos = await prisma.servico.findMany({
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }]
    });
    res.json(servicos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar serviços', detalhes: error.message });
  }
});

app.post('/api/servicos', async (req, res) => {
  try {
    const { nome, categoria, preco, duracaoMin } = req.body;
    if (!nome || !categoria || preco === undefined) {
      return res.status(400).json({ erro: 'Nome, categoria e preço são obrigatórios.' });
    }
    const novo = await prisma.servico.create({
      data: {
        nome,
        categoria,
        preco: Number(preco),
        duracaoMin: Number(duracaoMin || 30)
      }
    });
    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar serviço', detalhes: error.message });
  }
});

app.put('/api/servicos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nome, categoria, preco, duracaoMin, ativo } = req.body;
    const atualizado = await prisma.servico.update({
      where: { id },
      data: {
        nome,
        categoria,
        preco: Number(preco),
        duracaoMin: Number(duracaoMin),
        ativo: ativo !== undefined ? Boolean(ativo) : true
      }
    });
    res.json(atualizado);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao atualizar serviço', detalhes: error.message });
  }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.servico.delete({ where: { id } });
    res.json({ mensagem: 'Serviço removido com sucesso.' });
  } catch (error) {
    res.status(400).json({
      erro: 'Não foi possível excluir este serviço pois existem agendamentos vinculados a ele.',
      detalhes: error.message
    });
  }
});

// ==================== PROFISSIONAIS ====================
app.get('/api/profissionais', async (req, res) => {
  try {
    const profissionais = await prisma.profissional.findMany({
      include: { _count: { select: { agendamentos: true } } },
      orderBy: { nome: 'asc' }
    });
    res.json(profissionais);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar profissionais', detalhes: error.message });
  }
});

app.post('/api/profissionais', async (req, res) => {
  try {
    const { nome, especialidade, telefone } = req.body;
    if (!nome || !especialidade) {
      return res.status(400).json({ erro: 'Nome e especialidade são obrigatórios.' });
    }
    const novo = await prisma.profissional.create({
      data: { nome, especialidade, telefone: telefone || '' }
    });
    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar profissional', detalhes: error.message });
  }
});

app.delete('/api/profissionais/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.profissional.delete({ where: { id } });
    res.json({ mensagem: 'Profissional removido com sucesso.' });
  } catch (error) {
    res.status(400).json({
      erro: 'Não é possível remover profissional com agendamentos cadastrados.',
      detalhes: error.message
    });
  }
});

// ==================== AGENDAMENTOS ====================
app.get('/api/agendamentos', async (req, res) => {
  try {
    const { data, status, profissionalId } = req.query;
    const where = {};
    if (data) where.data = String(data);
    if (status) where.status = String(status);
    if (profissionalId) where.profissionalId = Number(profissionalId);

    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: {
        cliente: true,
        servico: true,
        profissional: true
      },
      orderBy: [{ data: 'asc' }, { horario: 'asc' }]
    });
    res.json(agendamentos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos', detalhes: error.message });
  }
});

app.post('/api/agendamentos', async (req, res) => {
  try {
    const {
      data,
      horario,
      clienteId,
      servicoId,
      profissionalId,
      valorCobrado,
      formaPagamento,
      observacoes
    } = req.body;

    if (!data || !horario || !clienteId || !servicoId || !profissionalId) {
      return res.status(400).json({
        erro: 'Preencha data, horário, cliente, serviço e profissional.'
      });
    }

    // Validação de conflito de horário para o mesmo profissional
    const conflito = await prisma.agendamento.findFirst({
      where: {
        data: String(data),
        horario: String(horario),
        profissionalId: Number(profissionalId),
        status: { not: 'CANCELADO' }
      }
    });

    if (conflito) {
      return res.status(409).json({
        erro: 'Este profissional já possui um atendimento agendado para essa mesma data e horário!'
      });
    }

    let valorFinal = valorCobrado;
    if (valorFinal === undefined || valorFinal === '') {
      const servico = await prisma.servico.findUnique({ where: { id: Number(servicoId) } });
      valorFinal = servico ? servico.preco : 0;
    }

    const novo = await prisma.agendamento.create({
      data: {
        data: String(data),
        horario: String(horario),
        clienteId: Number(clienteId),
        servicoId: Number(servicoId),
        profissionalId: Number(profissionalId),
        valorCobrado: Number(valorFinal),
        formaPagamento: formaPagamento || 'PIX',
        observacoes: observacoes || null
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true
      }
    });

    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao criar agendamento', detalhes: error.message });
  }
});

app.patch('/api/agendamentos/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, formaPagamento } = req.body;
    const atualizado = await prisma.agendamento.update({
      where: { id },
      data: {
        status,
        ...(formaPagamento ? { formaPagamento } : {})
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true
      }
    });
    res.json(atualizado);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao atualizar status do agendamento', detalhes: error.message });
  }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.agendamento.delete({ where: { id } });
    res.json({ mensagem: 'Agendamento excluído com sucesso.' });
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao excluir agendamento', detalhes: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor do Salão de Beleza rodando em http://localhost:${PORT}`);
});
