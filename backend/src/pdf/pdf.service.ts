// src/pdf/pdf.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectFile, FileStatus } from './entities/project-file.entity';
// IMPORTANTE: Importe a sua entidade de Projeto aqui (ajuste o caminho se necessário)
import { Projeto } from '../projetos/entities/projeto.entity'; 
import { GoogleDriveService } from './google-drive.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { extname } from 'path';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(ProjectFile)
    private readonly projectFileRepository: Repository<ProjectFile>,
    // 1. Injetamos o repositório de Projeto para conseguir buscar o título pelo ID
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async uploadExistingProjectPdf(
    file: Express.Multer.File,
    dto: { materialId: number; projetoId: number; uploadedBy: number }
  ): Promise<ProjectFile> {
    
    const fileSizeBytes = file.size;
    const originalName = file.originalname;
    const filePath = file.path;

    // 2. Busca o projeto no banco de dados para pegar o título
    const projeto = await this.projetoRepository.findOne({ where: { id: dto.projetoId } });
    if (!projeto) {
      // Se não achar o projeto, limpa o arquivo temporário do Multer para não entupir o Termux
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new NotFoundException(`Projeto com ID ${dto.projetoId} não foi encontrado.`);
    }

    // 3. Gerar Ano e Mês atual (Garante 2 dígitos para o mês, ex: "05")
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');

    // 4. Tratar o título do projeto (remover espaços extras e caracteres problemáticos se necessário)
    // Exemplo: "Sistema Comercial" vira "Sistema-Comercial" ou mantem com espaços (o Drive aceita espaços de boa)
    const tituloProjetoClean = projeto.titulo.replace(/\s+/g, '-'); 

    // 5. Montar o novo nome baseado na regra: ANO-MES-TITULO-ID.pdf
    const extensao = extname(originalName);
    const novoNomeDrive = `${ano}-${mes}-${tituloProjetoClean}-${dto.projetoId}${extensao}`;

    // Calcular Hash SHA-256 via Stream
    const checksumSha256 = await this.calculateFileHash(filePath);

    const projectFile = this.projectFileRepository.create({
      materialId: dto.materialId,
      projetoId: dto.projetoId,
      uploadedBy: dto.uploadedBy,
      originalName: originalName, // Mantemos o nome original guardado no Banco de Dados por segurança
      driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
      fileSizeBytes: fileSizeBytes,
      checksumSha256: checksumSha256,
      status: FileStatus.PENDING,
      version: 1,
    });

    const savedFile = await this.projectFileRepository.save(projectFile);

    try {
      const fileStream = fs.createReadStream(filePath);
      
      // 6. Passamos o 'novoNomeDrive' em vez do 'originalName' para o Google Drive
      const driveResponse = await this.googleDriveService.uploadFile(
        novoNomeDrive,
        fileStream,
        file.mimetype,
        savedFile.driveFolderId
      );

      savedFile.driveFileId = driveResponse.id || null;
      savedFile.driveWebViewLink = driveResponse.webViewLink || null;
      savedFile.status = FileStatus.VALID;

      return await this.projectFileRepository.save(savedFile);

    } catch (error) {
      savedFile.status = FileStatus.CORRUPTED;
      await this.projectFileRepository.save(savedFile);
      throw new Error(`Falha ao enviar para o Drive: ${error.message}`);
    } finally {
      // Limpa o arquivo temporário local do Termux/Servidor
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
  
  
  
  
  
  /**
   * Busca as informações do arquivo no banco e o stream de download no Google Drive
   */
  async downloadProjectPdf(projetoId: number, materialId: number) {
    const projectFile = await this.projectFileRepository.findOne({
      where: {
        projetoId: projetoId,
        materialId: materialId,
        status: FileStatus.VALID,
      },
      order: { criadoEm: 'DESC' }, // Garante que pega a versão mais recente
    });

    if (!projectFile || !projectFile.driveFileId) {
      throw new NotFoundException(
        `Nenhum PDF válido foi encontrado para o projeto ID ${projetoId} e material ID ${materialId}.`,
      );
    }

    const fileStream = await this.googleDriveService.downloadFileStream(projectFile.driveFileId);

    return {
      stream: fileStream,
      originalName: projectFile.originalName,
    };
  }
  
  
  
  
  
  

  private calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }
}
