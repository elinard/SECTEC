import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe, 
  UseGuards 
} from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
// Remova o "Param as ApiParam" que estava dando erro

@ApiTags('evento')
@Controller('evento')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo evento com cronograma completo' })
  @ApiResponse({ status: 201, description: 'Evento criado com sucesso.' })
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  @Post(':id/temas')
  @ApiOperation({ summary: 'Adiciona eixos temáticos ao evento' })
  addTemas(
    @Param('id', ParseIntPipe) id: number, 
    @Body() createTemasDto: CreateTemasDto
  ) {
    return this.eventoService.addTemas(id, createTemasDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os eventos cadastrados' })
  findAll() {
    return this.eventoService.findAll();
  }

  @Get('atual/vigente')
  @ApiOperation({ summary: 'Busca o evento mais recente do ano atual' })
  findAtual() {
    return this.eventoService.eventoAtual();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de um evento específico' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados e prazos de um evento' })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateEventoDto: UpdateEventoDto
  ) {
    return this.eventoService.update(id, updateEventoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa um evento (Exclusão lógica)' }) // Texto atualizado
  @ApiResponse({ status: 200, description: 'Evento marcado como inativo.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.remove(id);
  }


  @Post('temas/sincronizar')
  @ApiOperation({ 
    summary: 'Sincroniza os temas do orientador', 
    description: 'Envia uma lista completa de IDs de temas para o orientador.' 
  })
  @ApiResponse({ status: 201, description: 'Temas sincronizados com sucesso.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        temasIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3]
        }
      }
    }
  })
  @UseGuards(JwtAuthGuard) // Comentado para testes iniciais
  async sincronizar(
    @Body('temasIds') temasIds: number[],
    @GetUser('userId') orientadorId: number
  ) {
    return await this.eventoService.sincronizarTemas(orientadorId, temasIds);
  }
}
