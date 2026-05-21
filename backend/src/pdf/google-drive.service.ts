import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private drive;

  constructor() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    // MELHORIA: Em vez de dar um 'throw new Error' e derrubar o sistema inteiro,
    // apenas exibimos um aviso no log do servidor.
    if (!clientId || !clientSecret || !refreshToken) {
      console.warn(
        '⚠️ AVISO: As variáveis do Google Drive não foram configuradas. O upload e download de PDFs de projetos estarão desativados.',
      );
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  async uploadFile(
    fileName: string,
    fileStream: Readable,
    mimeType: string,
    parentFolderId?: string,
  ) {
    if (!this.drive) {
      throw new Error('Serviço de Google Drive indisponível no momento.');
    }

    const folderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    const fileMetadata = {
      name: fileName,
      parents: folderId ? [folderId] : [],
    };

    const media = {
      mimeType: mimeType,
      body: fileStream,
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  }

  async downloadFileStream(driveFileId: string): Promise<Readable> {
    if (!this.drive) {
      throw new Error('Serviço de Google Drive indisponível no momento.');
    }
    try {
      const response = await this.drive.files.get(
        { fileId: driveFileId, alt: 'media' },
        { responseType: 'stream' },
      );
      return response.data as Readable;
    } catch (error) {
      throw new Error(`Erro ao buscar stream no Google Drive: ${error.message}`);
    }
  }

  async updateFile(
    driveFileId: string,
    fileName: string,
    fileStream: Readable,
    mimeType: string,
  ) {
    if (!this.drive) {
      throw new Error('Serviço de Google Drive indisponível no momento.');
    }
    try {
      const response = await this.drive.files.update({
        fileId: driveFileId,
        requestBody: { name: fileName },
        media: { mimeType: mimeType, body: fileStream },
        fields: 'id, webViewLink',
      });

      return {
        id: response.data.id,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar arquivo no Google Drive: ${error.message}`);
    }
  }

  async deleteFile(driveFileId: string): Promise<void> {
    if (!this.drive) {
      throw new Error('Serviço de Google Drive indisponível no momento.');
    }
    try {
      await this.drive.files.delete({ fileId: driveFileId });
    } catch (error) {
      throw new Error(`Erro ao deletar arquivo no Google Drive: ${error.message}`);
    }
  }
}