const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');

  const products = [
    {
      name: 'Pizza de Calabresa',
      description: 'Mussarela, calabresa, cebola e orégano',
      price: 29.90,
      category: 'Pizzas Salgadas',
      available: true,
    },
    {
      name: 'Pizza de Mussarela',
      description: 'Mussarela de primeira qualidade, tomate e orégano',
      price: 25.90,
      category: 'Pizzas Salgadas',
      available: true,
    },
    {
      name: 'Pizza de Frango com Catupiry',
      description: 'Frango desfiado, catupiry, milho e tomate',
      price: 32.90,
      category: 'Pizzas Salgadas',
      available: true,
    },
    {
      name: 'Pizza Portuguesa',
      description: 'Mussarela, presunto, ovo, cebola, tomate e azeitona',
      price: 34.90,
      category: 'Pizzas Salgadas',
      available: true,
    },
    {
      name: 'Pizza de Chocolate',
      description: 'Chocolate ao leite, granulado e morango',
      price: 28.90,
      category: 'Pizzas Doces',
      available: true,
    },
    {
      name: 'Pizza de Romeu e Julieta',
      description: 'Queijo mussarela e goiabada',
      price: 26.90,
      category: 'Pizzas Doces',
      available: true,
    },
    {
      name: 'Refrigerante Coca-Cola 2L',
      description: 'Refrigerante de cola 2 litros',
      price: 8.90,
      category: 'Bebidas',
      available: true,
    },
    {
      name: 'Refrigerante Guaraná 2L',
      description: 'Refrigerante de guaraná 2 litros',
      price: 7.90,
      category: 'Bebidas',
      available: true,
    },
    {
      name: 'Suco de Laranja 500ml',
      description: 'Suco natural de laranja 500ml',
      price: 6.90,
      category: 'Bebidas',
      available: true,
    },
    {
      name: 'Água Mineral 500ml',
      description: 'Água mineral sem gás 500ml',
      price: 3.90,
      category: 'Bebidas',
      available: true,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('Products seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });