import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UsersSeed } from './users/users.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api'); 

  const seedService = app.get(UsersSeed);
  await seedService.run();
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API SECTEC')
    .setDescription('Sistema de Gerenciamento de Projetos - SECTEC')
    .setVersion('1.0')
    .addTag('projetos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); 

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🚀 API rodando em: http://localhost:3000/api`);
  console.log(`📑 Swagger rodando em: http://localhost:3000/docs`);
}

bootstrap();