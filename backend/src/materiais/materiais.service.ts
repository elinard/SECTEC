// src/materiais/materiais.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';

import {
  ProjetoMaterial,
  StatusMaterial,
  TipoMaterial,
} from './entities/projeto-material.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { PdfService } from '../pdf/pdf.service';
import { CreateMaterialDto } from './dto/create-material.dto';

@Injectable()
export class MateriaisService {
  constructor(
    @InjectRepository(ProjetoMaterial)
    private readonly materiaisRepository: Repository<ProjetoMaterial>,

    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,

    private readonly pdfService: PdfService,
  ) {}

  /**
   * Orquestra o fluxo de gerenciamento de materiais acadêmicos.
   * Identifica automaticamente se a requisição se trata de uma primeira entrega ou de uma substituição.
   * 
   * @param file Arquivo binário opcional enviado via interceptor (Multer).
   * @param dto Dados de transferência contendo o ID do projeto, tipo e conteúdo do material.
   * @param userId ID do aluno autenticado realizando a ação.
   * @returns Resposta padronizada com o status do processamento local e na nuvem.
   */
  async criarMaterial(
    file: Express.Multer.File | undefined,
    dto: CreateMaterialDto,
    userId: number,
  ) {
    const projetoIdNum = Number(dto.projetoId);

    // 1. Validações preliminares obrigatórias
    const projeto = await this.buscarEValidarProjeto(projetoIdNum, file);
    this.validarPayloadPorTipo(dto.tipo, dto.conteudo, file);

    // 2. Busca se já existe um material do mesmo tipo para o projeto
    const materialExistente = await this.materiaisRepository.findOne({
      where: { projeto: { id: projetoIdNum }, tipo: dto.tipo },
    });

    // 3. Desvia o fluxo baseado na existência do material (Substituição vs Criação)
    if (materialExistente) {
      return this.processarSubstituicaoMaterial(materialExistente, projeto, file, dto, userId);
    }

    return this.processarCriacaoMaterial(projeto, file, dto, userId);
  }

  /**
   * Permite ao aluno cancelar o envio de um material acadêmico feito por engano.
   * Valida se a entrega ainda está em análise e se foi realizada há menos de 1 hora.
   * Remove de forma limpa o registro e expurga o arquivo binário do Google Drive.
   * 
   * @param materialId ID numérico do material a ser cancelado.
   * @returns Resposta de confirmação da remoção.
   */
  async cancelarMaterial(materialId: number): Promise<{ mensagem: string }> {
    // 1. Busca o material alvo no banco de dados
    const material = await this.materiaisRepository.findOne({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material com ID ${materialId} não foi encontrado.`);
    }

    // 2. Impede o cancelamento caso o orientador já tenha alterado o status (aprovado/recusado)
    if (material.status !== StatusMaterial.EM_ANALISE) {
      throw new ConflictException(
        `Este material não pode ser cancelado pois já foi avaliado ou está com status '${material.status}'.`,
      );
    }

    // 3. Validação matemática do teto limite de 1 hora (3600000 ms)
    const agora = new Date();
    const tempoDecorridoMs = agora.getTime() - new Date(material.criadoEm).getTime();
    const umaHoraMs = 1000 * 60 * 60;

    if (tempoDecorridoMs > umaHoraMs) {
      throw new BadRequestException(
        'O prazo limite de 1 hora para o cancelamento deste material expirou.',
      );
    }

    // 4. Se o tipo exigir arquivo binário, faz a limpeza na nuvem (Google Drive) e na tabela de arquivos
    if (this.verificarSeTipoExigeArquivo(material.tipo)) {
      const arquivoBanco = await this.pdfService.projectFileRepository.findOne({
        where: { materialId: material.id },
        order: { criadoEm: 'DESC' },
      });

      if (arquivoBanco && arquivoBanco.driveFileId) {
        try {
          // Acessa dinamicamente a propriedade privada ou instanciada do googleDriveService contida no PdfService
          await this.pdfService['googleDriveService'].deleteFile(arquivoBanco.driveFileId);
        } catch (driveError) {
          // Silencia o erro caso o arquivo físico já tenha sido removido manualmente ou não seja localizado
        }
        // Remove os metadados do arquivo atrelado
        await this.pdfService.projectFileRepository.remove(arquivoBanco);
      }
    }

    // 5. Deleta definitivamente o material da tabela
    await this.materiaisRepository.remove(material);

    return {
      mensagem: 'Entrega do material cancelada e removida com sucesso.',
    };
  }

  // =========================================================================
  // MÉTODOS PRIVADOS DE FLUXO DE NEGÓCIO (CORE LOGIC)
  // =========================================================================

  /**
   * Trata o fluxo de reentrega de um material que foi previamente recusado pelo orientador.
   */
  private async processarSubstituicaoMaterial(
    material: ProjetoMaterial,
    projeto: Projeto,
    file: Express.Multer.File | undefined,
    dto: CreateMaterialDto,
    userId: number,
  ) {
    // Se o material existente não estiver recusado, ele não pode ser alterado
    if (material.status !== StatusMaterial.RECUSADO) {
      this.removerArquivoTemporario(file);
      throw new ConflictException(
        `Já existe um material do tipo '${dto.tipo}' pendente de análise ou já aprovado.`,
      );
    }

    // Reseta o estado do material para nova análise institucional
    material.status = StatusMaterial.EM_ANALISE;
    material.opiniao = 'Aguardando avaliação da nova versão do material pelo orientador.';
    material.conteudo = dto.conteudo || `Arquivo ${dto.tipo} atualizado enviado para avaliação.`;

    const materialAtualizado = await this.materiaisRepository.save(material);

    // Se o tipo exigir arquivo, atualiza o binário no Google Drive
    if (this.verificarSeTipoExigeArquivo(dto.tipo) && file) {
      try {
        let dadosArquivoDrive;

        // Tenta localizar o registro do arquivo anterior gerado para este material
        const possuiArquivoNoBanco = await this.pdfService.projectFileRepository.findOne({
          where: { materialId: materialAtualizado.id },
          order: { criadoEm: 'DESC' }
        });

        // SE o arquivo existia no banco E possui ID do drive válido, executa a atualização direta
        if (possuiArquivoNoBanco && possuiArquivoNoBanco.driveFileId) {
          dadosArquivoDrive = await this.pdfService.substituirProjectPdf(file, {
            materialId: materialAtualizado.id,
            projetoId: projeto.id,
            uploadedBy: userId,
          });
        } else {
          // SE não possuía ou estava quebrado, faz uma nova postagem do zero (Fallback seguro)
          dadosArquivoDrive = await this.pdfService.uploadExistingProjectPdf(file, {
            materialId: materialAtualizado.id,
            projetoId: projeto.id,
            uploadedBy: userId,
          });
        }

        return {
          mensagem: 'Nova versão do arquivo PDF substituída e enviada com sucesso!',
          material: materialAtualizado,
          arquivo: dadosArquivoDrive,
        };
      } catch (error) {
        await this.tratarFalhaEnvioDrive(materialAtualizado, `Falha na substituição do arquivo na nuvem: ${error.message}`);
        throw new BadRequestException('Material updated locally, but disk or cloud substitution failed.');
      }
    }

    return {
      mensagem: 'Link do material atualizado com sucesso!',
      material: materialAtualizado,
    };
  }

  /**
   * Trata o fluxo de primeira entrega de um material para o projeto.
   */
  private async processarCriacaoMaterial(
    projeto: Projeto,
    file: Express.Multer.File | undefined,
    dto: CreateMaterialDto,
    userId: number,
  ) {
    // Valida o teto regulamentar de entregas do projeto
    await this.validarLimiteMaximoMateriais(projeto.id, file);

    const novoMaterial = this.materiaisRepository.create({
      projeto: projeto,
      tipo: dto.tipo,
      status: StatusMaterial.EM_ANALISE,
      conteudo: dto.conteudo || `Arquivo ${dto.tipo} enviado para avaliação.`,
      opiniao: 'Aguardando avaliação do orientador.',
    });
    
    const materialSalvo = await this.materiaisRepository.save(novoMaterial);

    // Se o tipo exigir arquivo, faz o upload inicial para o Google Drive
    if (this.verificarSeTipoExigeArquivo(dto.tipo) && file) {
      try {
        const dadosArquivoDrive = await this.pdfService.uploadExistingProjectPdf(file, {
          materialId: materialSalvo.id,
          projetoId: projeto.id,
          uploadedBy: userId,
        });

        return {
          mensagem: 'Material e arquivo PDF salvos com sucesso!',
          material: materialSalvo,
          arquivo: dadosArquivoDrive,
        };
      } catch (error) {
        await this.tratarFalhaEnvioDrive(materialSalvo, `Falha crítica de upload: ${error.message}`);
        throw new BadRequestException('Material criado localmente, mas o envio ao Drive failed.');
      }
    }

    return {
      mensagem: 'Material do tipo link registrado com sucesso!',
      material: materialSalvo,
    };
  }

  // =========================================================================
  // MÉTODOS PRIVADOS DE VALIDAÇÃO E SUPORTE (HELPERS)
  // =========================================================================

  /**
   * Garante a existência do projeto alvo no banco de dados.
   */
  private async buscarEValidarProjeto(projetoId: number, file: Express.Multer.File | undefined): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({ where: { id: projetoId } });
    if (!projeto) {
      this.removerArquivoTemporario(file);
      throw new NotFoundException(`Projeto com ID ${projetoId} não foi encontrado.`);
    }
    return projeto;
  }

  /**
   * Aplica as regras de integridade do payload de acordo com a categoria do material entregue.
   */
  private validarPayloadPorTipo(tipo: TipoMaterial, conteudo: string | undefined, file: Express.Multer.File | undefined): void {
    if (tipo === TipoMaterial.LINK && !conteudo) {
      throw new BadRequestException('Para materiais do tipo link, o campo conteúdo (URL) é obrigatório.');
    }

    if (this.verificarSeTipoExigeArquivo(tipo) && !file) {
      throw new BadRequestException(`O envio do arquivo físico PDF é obrigatório para o tipo '${tipo}'.`);
    }
  }

  /**
   * Valida se o projeto respeita a restrição acadêmica de no máximo 3 entregas de materiais.
   */
  private async validarLimiteMaximoMateriais(projetoId: number, file: Express.Multer.File | undefined): Promise<void> {
    const totalMateriais = await this.materiaisRepository.count({
      where: { projeto: { id: projetoId } },
    });

    if (totalMateriais >= 3) {
      this.removerArquivoTemporario(file);
      throw new BadRequestException('Este projeto já atingiu o limite máximo de 3 materiais entregues.');
    }
  }

  /**
   * Determina de forma centralizada se um determinado tipo de material exige persistência de arquivo físico.
   */
  private verificarSeTipoExigeArquivo(tipo: TipoMaterial): boolean {
    return tipo === TipoMaterial.PDF || tipo === TipoMaterial.RELATORIO;
  }

  /**
   * Executa o rollback parcial de status caso ocorra um erro de comunicação com a API do Google Drive.
   */
  private async tratarFalhaEnvioDrive(material: ProjetoMaterial, motivoErro: string): Promise<void> {
    material.status = StatusMaterial.RECUSADO;
    material.opiniao = motivoErro;
    await this.materiaisRepository.save(material);
  }

  /**
   * Remove arquivos órfãos do armazenamento local temporário para evitar desperdício de espaço em disco.
   */
  private removerArquivoTemporario(file: Express.Multer.File | undefined): void {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}
