import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  async generateQRCode(url: string): Promise<string> {
    return QRCode.toDataURL(url);
  }
}
