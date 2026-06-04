import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.task.createMany({
    data: [
      {
        title: 'Описать тему проекта',
        description: 'Подготовить краткое описание StudyFlow для лабораторной',
        status: 'done',
        priority: 'medium',
        completedAt: new Date()
      },
      {
        title: 'Собрать CRUD для задач',
        description: 'Проверить создание, изменение статуса и удаление',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 86_400_000)
      },
      {
        title: 'Подготовить Keycloak',
        description: 'Следующий инкремент по OAuth/OpenID Connect',
        status: 'todo',
        priority: 'low'
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

