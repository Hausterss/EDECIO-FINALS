const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Populando banco de dados do Salão BelleVie...');

  await prisma.agendamento.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.profissional.deleteMany();

  const prof1 = await prisma.profissional.create({
    data: { nome: 'Camila Martins', especialidade: 'Cabeleireira & Colorista', telefone: '(53) 99112-3344' }
  });
  const prof2 = await prisma.profissional.create({
    data: { nome: 'Juliana Costa', especialidade: 'Manicure & Nail Designer', telefone: '(53) 99145-7788' }
  });
  const prof3 = await prisma.profissional.create({
    data: { nome: 'Renata Oliveira', especialidade: 'Estética & Maquiagem', telefone: '(53) 98422-1199' }
  });

  const sCorte = await prisma.servico.create({
    data: { nome: 'Corte Feminino + Escova', categoria: 'Cabelo', preco: 120.0, duracaoMin: 60 }
  });
  const sHidratacao = await prisma.servico.create({
    data: { nome: 'Hidratação Profunda Joico', categoria: 'Cabelo', preco: 150.0, duracaoMin: 50 }
  });
  const sLuzes = await prisma.servico.create({
    data: { nome: 'Mechas / Morena Iluminada', categoria: 'Cabelo', preco: 380.0, duracaoMin: 180 }
  });
  const sManicure = await prisma.servico.create({
    data: { nome: 'Pé e Mão Tradicional', categoria: 'Unhas', preco: 65.0, duracaoMin: 60 }
  });
  const sGel = await prisma.servico.create({
    data: { nome: 'Alongamento Fibra de Vidro', categoria: 'Unhas', preco: 190.0, duracaoMin: 120 }
  });
  const sMake = await prisma.servico.create({
    data: { nome: 'Maquiagem Social Completa', categoria: 'Maquiagem', preco: 160.0, duracaoMin: 60 }
  });

  const c1 = await prisma.cliente.create({
    data: {
      nome: 'Mariana Souza',
      telefone: '(53) 99123-4567',
      email: 'mariana.souza@email.com',
      observacoes: 'Prefere atendimento pela manhã'
    }
  });
  const c2 = await prisma.cliente.create({
    data: {
      nome: 'Fernanda Lima',
      telefone: '(53) 98456-7890',
      email: 'fernanda.lima@email.com',
      observacoes: 'Alérgica a esmalte comum (usar hipoalergênico)'
    }
  });
  const c3 = await prisma.cliente.create({
    data: {
      nome: 'Beatriz Rocha',
      telefone: '(53) 99988-1122',
      email: 'bia.rocha@email.com',
      observacoes: 'Cliente VIP mensal'
    }
  });
  const c4 = await prisma.cliente.create({
    data: {
      nome: 'Larissa Mendes',
      telefone: '(53) 98111-2233',
      email: 'larissa.m@email.com'
    }
  });

  const hoje = new Date().toISOString().split('T')[0];

  await prisma.agendamento.createMany({
    data: [
      {
        data: hoje,
        horario: '09:00',
        status: 'CONCLUIDO',
        formaPagamento: 'PIX',
        valorCobrado: 120.0,
        clienteId: c1.id,
        servicoId: sCorte.id,
        profissionalId: prof1.id,
        observacoes: 'Finalizado com óleo reparador'
      },
      {
        data: hoje,
        horario: '10:30',
        status: 'CONCLUIDO',
        formaPagamento: 'Cartão de Crédito',
        valorCobrado: 190.0,
        clienteId: c2.id,
        servicoId: sGel.id,
        profissionalId: prof2.id,
        observacoes: 'Formato amendoado nude'
      },
      {
        data: hoje,
        horario: '14:00',
        status: 'AGENDADO',
        formaPagamento: 'PIX',
        valorCobrado: 380.0,
        clienteId: c3.id,
        servicoId: sLuzes.id,
        profissionalId: prof1.id,
        observacoes: 'Tom mel dourado'
      },
      {
        data: hoje,
        horario: '16:00',
        status: 'AGENDADO',
        formaPagamento: 'Dinheiro',
        valorCobrado: 160.0,
        clienteId: c4.id,
        servicoId: sMake.id,
        profissionalId: prof3.id,
        observacoes: 'Formatura à noite'
      },
      {
        data: hoje,
        horario: '17:30',
        status: 'AGENDADO',
        formaPagamento: 'PIX',
        valorCobrado: 65.0,
        clienteId: c1.id,
        servicoId: sManicure.id,
        profissionalId: prof2.id
      }
    ]
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
