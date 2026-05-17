// src/materiais/materiais.controller.ts
import { 
  Controller, 
  Post, 
  Delete,
  Param,
  ParseIntPipe,
  UseInterceptors, 
  UploadedFile, 
  Body, 
  UseGuards 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiConsumes, 
  ApiBody, 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiParam 
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { MateriaisService } from './materiais.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Materiais do Projeto')
@Controller('materiais')
@ApiBearerAuth('token-jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORIENTADOR) // Padrão da classe para fins administrativos
export class MateriaisController {
  constructor(private readonly materiaisService: MateriaisService) {}

  @Post()
  @Roles(UserRole.ALUNO) // Sobrescreve para permitir que o aluno envie a entrega
  @ApiOperation({ summary: 'Cria a entrega de um material para o projeto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMaterialDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './tmp',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async criarMaterial(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateMaterialDto,
    @GetUser('id') userId: number,
  ) {
    return await this.materiaisService.criarMaterial(file, body, userId);
  }

  @Delete(':id/cancelar')
  @Roles(UserRole.ALUNO) // Garante que apenas o aluno dono do fluxo realize o cancelamento
  @ApiOperation({ summary: 'Cancela o envio de um material antes da avaliação dentro da janela de 1 hora' })
  @ApiParam({ name: 'id', description: 'ID numérico do material a ser cancelado', type: Number })
  async cancelarMaterial(@Param('id', ParseIntPipe) materialId: number) {
    return await this.materiaisService.cancelarMaterial(materialId);
  }
}
