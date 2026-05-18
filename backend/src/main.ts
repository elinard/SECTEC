import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// 🚀 CORREÇÃO: Importando o UsersSeed e o UsersModule no topo do arquivo
import { UsersSeed } from './users/users.seed'; 
import { UsersModule } from './users/users.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Defina um prefixo global para todas as rotas da API (ex: /api)
  app.setGlobalPrefix('api'); 
  
  // 🚀 SEGURANÇA NA INJEÇÃO: Seleciona o UsersModule antes de dar o .get()
  const seedService = app.select(UsersModule).get(UsersSeed);
  await seedService.run();
  
  app.enableCors();

  // 2. CONFIGURAÇÃO DO SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API SECTEC')
    .setDescription('Sistema de Gerenciamento de Projetos - SECTEC')
    .setVersion('1.0')
    .addTag('projetos')
    .addBearerAuth( 
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o seu token JWT aqui',
        in: 'header',
      },
      'token-jwt', 
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // 3. Mude o endpoint do Swagger para /docs ou algo diferente de /api
  SwaggerModule.setup('docs', app, document); 

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🚀 API rodando em: http://localhost:3000/api`);
  console.log(`📑 Swagger rodando em: http://localhost:3000/docs`);
}

bootstrap();
