import React, { useEffect, useState } from 'react';
import {
  Scissors,
  Calendar,
  Users,
  Sparkles,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  DollarSign,
  UserCheck,
  Search,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('agendamentos');
  const [resumo, setResumo] = useState({
    totalClientes: 0,
    totalServicos: 0,
    totalProfissionais: 0,
    totalAgendamentos: 0,
    agendamentosPendentes: 0,
    agendamentosConcluidos: 0,
    faturamentoTotal: 0,
    faturamentoPrevisto: 0
  });

  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);

  // Filtros
  const [filtroData, setFiltroData] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');

  // Mensagens de feedback
  const [aviso, setAviso] = useState(null);

  // Formulário de Novo Agendamento
  const hoje = new Date().toISOString().split('T')[0];
  const [formAgendamento, setFormAgendamento] = useState({
    data: hoje,
    horario: '14:00',
    clienteId: '',
    servicoId: '',
    profissionalId: '',
    valorCobrado: '',
    formaPagamento: 'PIX',
    observacoes: ''
  });

  // Formulário de Novo Cliente
  const [formCliente, setFormCliente] = useState({
    nome: '',
    telefone: '',
    email: '',
    observacoes: ''
  });

  // Formulário de Novo Serviço
  const [formServico, setFormServico] = useState({
    nome: '',
    categoria: 'Cabelo',
    preco: '',
    duracaoMin: '60'
  });

  // Formulário de Novo Profissional
  const [formProfissional, setFormProfissional] = useState({
    nome: '',
    especialidade: '',
    telefone: ''
  });

  const mostrarAviso = (texto, tipo = 'sucesso') => {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 4000);
  };

  const carregarTudo = async () => {
    try {
      const paramsAg = new URLSearchParams();
      if (filtroData) paramsAg.append('data', filtroData);
      if (filtroStatus) paramsAg.append('status', filtroStatus);

      const [resDash, resAg, resCli, resServ, resProf] = await Promise.all([
        fetch(`${API_URL}/dashboard`),
        fetch(`${API_URL}/agendamentos?${paramsAg.toString()}`),
        fetch(`${API_URL}/clientes?busca=${encodeURIComponent(buscaCliente)}`),
        fetch(`${API_URL}/servicos`),
        fetch(`${API_URL}/profissionais`)
      ]);

      if (resDash.ok) setResumo(await resDash.json());
      if (resAg.ok) setAgendamentos(await resAg.json());
      if (resCli.ok) setClientes(await resCli.json());
      if (resServ.ok) setServicos(await resServ.json());
      if (resProf.ok) setProfissionais(await resProf.json());
    } catch (err) {
      mostrarAviso('Não foi possível conectar ao servidor Back-end (porta 3001).', 'erro');
    }
  };

  useEffect(() => {
    carregarTudo();
  }, [filtroData, filtroStatus, buscaCliente]);

  // Preenche automaticamente o valor quando escolhe o serviço
  const aoSelecionarServico = (servicoId) => {
    const serv = servicos.find((s) => s.id === Number(servicoId));
    setFormAgendamento((prev) => ({
      ...prev,
      servicoId,
      valorCobrado: serv ? String(serv.preco) : ''
    }));
  };

  // ==================== HANDLERS AGENDAMENTO ====================
  const salvarAgendamento = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_URL}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formAgendamento)
      });
      const dados = await resp.json();
      if (!resp.ok) {
        mostrarAviso(dados.erro || 'Erro ao agendar horário', 'erro');
        return;
      }
      mostrarAviso('Agendamento registrado com sucesso!');
      setFormAgendamento({
        ...formAgendamento,
        horario: '15:00',
        observacoes: ''
      });
      carregarTudo();
    } catch (error) {
      mostrarAviso('Erro de conexão ao salvar agendamento.', 'erro');
    }
  };

  const alterarStatusAgendamento = async (id, novoStatus) => {
    try {
      const resp = await fetch(`${API_URL}/agendamentos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (resp.ok) {
        mostrarAviso(`Status atualizado para ${novoStatus}!`);
        carregarTudo();
      }
    } catch (error) {
      mostrarAviso('Erro ao atualizar status.', 'erro');
    }
  };

  const excluirAgendamento = async (id) => {
    if (!window.confirm('Deseja realmente excluir este agendamento?')) return;
    await fetch(`${API_URL}/agendamentos/${id}`, { method: 'DELETE' });
    mostrarAviso('Agendamento removido.');
    carregarTudo();
  };

  // ==================== HANDLERS CLIENTE ====================
  const salvarCliente = async (e) => {
    e.preventDefault();
    const resp = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formCliente)
    });
    const dados = await resp.json();
    if (!resp.ok) {
      mostrarAviso(dados.erro || 'Erro ao cadastrar cliente', 'erro');
      return;
    }
    mostrarAviso('Cliente cadastrado com sucesso!');
    setFormCliente({ nome: '', telefone: '', email: '', observacoes: '' });
    carregarTudo();
  };

  const excluirCliente = async (id) => {
    if (!window.confirm('Excluir este cliente e seus agendamentos?')) return;
    await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
    mostrarAviso('Cliente removido.');
    carregarTudo();
  };

  // ==================== HANDLERS SERVIÇO ====================
  const salvarServico = async (e) => {
    e.preventDefault();
    const resp = await fetch(`${API_URL}/servicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formServico)
    });
    const dados = await resp.json();
    if (!resp.ok) {
      mostrarAviso(dados.erro || 'Erro ao cadastrar serviço', 'erro');
      return;
    }
    mostrarAviso('Serviço adicionado ao catálogo!');
    setFormServico({ nome: '', categoria: 'Cabelo', preco: '', duracaoMin: '60' });
    carregarTudo();
  };

  const excluirServico = async (id) => {
    if (!window.confirm('Deseja excluir este serviço?')) return;
    const resp = await fetch(`${API_URL}/servicos/${id}`, { method: 'DELETE' });
    const dados = await resp.json();
    if (!resp.ok) {
      mostrarAviso(dados.erro || 'Erro ao excluir serviço', 'erro');
      return;
    }
    mostrarAviso('Serviço excluído.');
    carregarTudo();
  };

  // ==================== HANDLERS PROFISSIONAL ====================
  const salvarProfissional = async (e) => {
    e.preventDefault();
    const resp = await fetch(`${API_URL}/profissionais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProfissional)
    });
    const dados = await resp.json();
    if (!resp.ok) {
      mostrarAviso(dados.erro || 'Erro ao cadastrar profissional', 'erro');
      return;
    }
    mostrarAviso('Profissional cadastrado com sucesso!');
    setFormProfissional({ nome: '', especialidade: '', telefone: '' });
    carregarTudo();
  };

  const excluirProfissional = async (id) => {
    if (!window.confirm('Deseja remover este profissional?')) return;
    const resp = await fetch(`${API_URL}/profissionais/${id}`, { method: 'DELETE' });
    const dados = await resp.json();
    if (!resp.ok) {
      mostrarAviso(dados.erro || 'Não foi possível excluir', 'erro');
      return;
    }
    mostrarAviso('Profissional removido.');
    carregarTudo();
  };

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Scissors className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">BelleVie • Studio & Salão de Beleza</h1>
              <p className="text-rose-100 text-sm">
                Sistema de Controle de Agendamentos, Serviços, Clientes e Caixa
              </p>
            </div>
          </div>

          {/* NAVEGAÇÃO DE ABAS */}
          <nav className="flex flex-wrap gap-2">
            {[
              { id: 'agendamentos', label: 'Agenda & Caixa', icon: Calendar },
              { id: 'clientes', label: 'Clientes', icon: Users },
              { id: 'servicos', label: 'Serviços', icon: Sparkles },
              { id: 'profissionais', label: 'Profissionais', icon: UserCheck }
            ].map((item) => {
              const Icon = item.icon;
              const ativo = abaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAbaAtiva(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    ativo
                      ? 'bg-white text-rose-700 shadow-md'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ALERTA / TOAST */}
      {aviso && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm ${
              aviso.tipo === 'erro'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{aviso.texto}</span>
          </div>
        </div>
      )}

      {/* CARDS DE RESUMO (DASHBOARD) */}
      <section className="max-w-7xl mx-auto px-4 mt-6 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Faturamento Recebido
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatarMoeda(resumo.faturamentoTotal)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {resumo.agendamentosConcluidos} atendimentos concluídos
            </p>
          </div>
          <div className="bg-emerald-100 text-emerald-600 p-3.5 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              A Receber (Agendados)
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatarMoeda(resumo.faturamentoPrevisto)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {resumo.agendamentosPendentes} horários aguardando
            </p>
          </div>
          <div className="bg-amber-100 text-amber-600 p-3.5 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Clientes Cadastradas
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{resumo.totalClientes}</p>
            <p className="text-xs text-slate-500 mt-1">Histórico ativo no salão</p>
          </div>
          <div className="bg-rose-100 text-rose-600 p-3.5 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Catálogo & Equipe
            </p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {resumo.totalServicos} serviços
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {resumo.totalProfissionais} profissionais atuando
            </p>
          </div>
          <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {/* ==================== ABA 1: AGENDAMENTOS ==================== */}
        {abaAtiva === 'agendamentos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FORMULÁRIO DE NOVO AGENDAMENTO */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 h-fit">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-rose-600" />
                Novo Agendamento
              </h2>
              <form onSubmit={salvarAgendamento} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={formAgendamento.data}
                      onChange={(e) =>
                        setFormAgendamento({ ...formAgendamento, data: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      required
                      value={formAgendamento.horario}
                      onChange={(e) =>
                        setFormAgendamento({ ...formAgendamento, horario: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cliente</label>
                  <select
                    required
                    value={formAgendamento.clienteId}
                    onChange={(e) =>
                      setFormAgendamento({ ...formAgendamento, clienteId: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Selecione a cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.telefone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Serviço Desejado
                  </label>
                  <select
                    required
                    value={formAgendamento.servicoId}
                    onChange={(e) => aoSelecionarServico(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Selecione o procedimento...</option>
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.categoria}] {s.nome} — {formatarMoeda(s.preco)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Profissional Responsável
                  </label>
                  <select
                    required
                    value={formAgendamento.profissionalId}
                    onChange={(e) =>
                      setFormAgendamento({ ...formAgendamento, profissionalId: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Selecione a profissional...</option>
                    {profissionais.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.especialidade})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Valor Cobrado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formAgendamento.valorCobrado}
                      onChange={(e) =>
                        setFormAgendamento({ ...formAgendamento, valorCobrado: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Pagamento
                    </label>
                    <select
                      value={formAgendamento.formaPagamento}
                      onChange={(e) =>
                        setFormAgendamento({ ...formAgendamento, formaPagamento: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Trazer referência de cor..."
                    value={formAgendamento.observacoes}
                    onChange={(e) =>
                      setFormAgendamento({ ...formAgendamento, observacoes: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition"
                >
                  Confirmar Agendamento
                </button>
              </form>
            </div>

            {/* LISTA DE AGENDAMENTOS */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-slate-800">Agenda de Atendimentos</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm"
                  />
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm"
                  >
                    <option value="">Todos os Status</option>
                    <option value="AGENDADO">Agendados</option>
                    <option value="CONCLUIDO">Concluídos</option>
                    <option value="CANCELADO">Cancelados</option>
                  </select>
                  {(filtroData || filtroStatus) && (
                    <button
                      onClick={() => {
                        setFiltroData('');
                        setFiltroStatus('');
                      }}
                      className="text-xs text-rose-600 hover:underline font-medium px-2"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>

              {agendamentos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  Nenhum agendamento encontrado para os filtros selecionados.
                </div>
              ) : (
                <div className="space-y-3">
                  {agendamentos.map((ag) => (
                    <div
                      key={ag.id}
                      className="border border-slate-100 hover:border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="bg-rose-100 text-rose-800 font-bold text-xs px-2.5 py-1 rounded-lg">
                            {ag.data.split('-').reverse().join('/')} às {ag.horario}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              ag.status === 'CONCLUIDO'
                                ? 'bg-emerald-100 text-emerald-700'
                                : ag.status === 'CANCELADO'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {ag.status}
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {ag.cliente?.nome}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600">
                          <strong className="text-rose-700">{ag.servico?.nome}</strong> • Profissional:{' '}
                          <span className="font-medium">{ag.profissional?.nome}</span>
                        </p>

                        {ag.observacoes && (
                          <p className="text-xs text-slate-500 italic">Obs: {ag.observacoes}</p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-end justify-between gap-2">
                        <div className="text-right">
                          <p className="text-base font-bold text-slate-800">
                            {formatarMoeda(ag.valorCobrado)}
                          </p>
                          <p className="text-xs text-slate-400">{ag.formaPagamento}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {ag.status === 'AGENDADO' && (
                            <>
                              <button
                                onClick={() => alterarStatusAgendamento(ag.id, 'CONCLUIDO')}
                                title="Marcar como Concluído"
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Concluir
                              </button>
                              <button
                                onClick={() => alterarStatusAgendamento(ag.id, 'CANCELADO')}
                                title="Cancelar Agendamento"
                                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancelar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => excluirAgendamento(ag.id)}
                            title="Excluir registro"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== ABA 2: CLIENTES ==================== */}
        {abaAtiva === 'clientes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 h-fit">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-rose-600" />
                Cadastrar Cliente
              </h2>
              <form onSubmit={salvarCliente} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ana Paula Silva"
                    value={formCliente.nome}
                    onChange={(e) => setFormCliente({ ...formCliente, nome: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(53) 99999-0000"
                    value={formCliente.telefone}
                    onChange={(e) => setFormCliente({ ...formCliente, telefone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formCliente.email}
                    onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Observações / Alergias
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Anote preferências ou restrições..."
                    value={formCliente.observacoes}
                    onChange={(e) =>
                      setFormCliente({ ...formCliente, observacoes: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl transition"
                >
                  Salvar Cliente
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-slate-800">Base de Clientes</h2>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    className="border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-sm w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clientes.map((c) => (
                  <div
                    key={c.id}
                    className="border border-slate-100 rounded-2xl p-4 flex items-start justify-between bg-slate-50/40"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">{c.nome}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-rose-500" />
                        {c.telefone}
                      </p>
                      {c.email && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-rose-500" />
                          {c.email}
                        </p>
                      )}
                      {c.observacoes && (
                        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1">
                          {c.observacoes}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 pt-1">
                        {c._count?.agendamentos || 0} atendimentos registrados
                      </p>
                    </div>
                    <button
                      onClick={() => excluirCliente(c.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABA 3: SERVIÇOS ==================== */}
        {abaAtiva === 'servicos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 h-fit">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-rose-600" />
                Novo Serviço / Procedimento
              </h2>
              <form onSubmit={salvarServico} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome do Serviço
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Progressiva Sem Formol"
                    value={formServico.nome}
                    onChange={(e) => setFormServico({ ...formServico, nome: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formServico.categoria}
                    onChange={(e) => setFormServico({ ...formServico, categoria: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="Cabelo">Cabelo</option>
                    <option value="Unhas">Unhas</option>
                    <option value="Maquiagem">Maquiagem</option>
                    <option value="Estética">Estética & Sobrancelhas</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="120.00"
                      value={formServico.preco}
                      onChange={(e) => setFormServico({ ...formServico, preco: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Duração (min)
                    </label>
                    <input
                      type="number"
                      required
                      value={formServico.duracaoMin}
                      onChange={(e) =>
                        setFormServico({ ...formServico, duracaoMin: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl transition"
                >
                  Adicionar Serviço
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
              <h2 className="text-lg font-bold text-slate-800 mb-5">Tabela de Serviços e Preços</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {servicos.map((s) => (
                  <div
                    key={s.id}
                    className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between bg-slate-50/40"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                        {s.categoria}
                      </span>
                      <p className="font-bold text-slate-800 mt-1">{s.nome}</p>
                      <p className="text-xs text-slate-500">Duração média: {s.duracaoMin} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-emerald-700">
                        {formatarMoeda(s.preco)}
                      </span>
                      <button
                        onClick={() => excluirServico(s.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABA 4: PROFISSIONAIS ==================== */}
        {abaAtiva === 'profissionais' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 h-fit">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-rose-600" />
                Novo Profissional
              </h2>
              <form onSubmit={salvarProfissional} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carla Dias"
                    value={formProfissional.nome}
                    onChange={(e) =>
                      setFormProfissional({ ...formProfissional, nome: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Colorista / Manicure"
                    value={formProfissional.especialidade}
                    onChange={(e) =>
                      setFormProfissional({ ...formProfissional, especialidade: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(53) 99999-1111"
                    value={formProfissional.telefone}
                    onChange={(e) =>
                      setFormProfissional({ ...formProfissional, telefone: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl transition"
                >
                  Cadastrar Profissional
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
              <h2 className="text-lg font-bold text-slate-800 mb-5">Equipe do Salão</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profissionais.map((p) => (
                  <div
                    key={p.id}
                    className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between bg-slate-50/40"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{p.nome}</p>
                      <p className="text-xs font-semibold text-rose-600">{p.especialidade}</p>
                      {p.telefone && <p className="text-xs text-slate-500 mt-1">{p.telefone}</p>}
                      <p className="text-xs text-slate-400 mt-1">
                        {p._count?.agendamentos || 0} agendamentos vinculados
                      </p>
                    </div>
                    <button
                      onClick={() => excluirProfissional(p.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
