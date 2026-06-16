// Importações tratadas pelo Vite — geram URLs com hash para produção
import logoGrandeMPRJUrl from './Logo Grande MPRJ.png';
import logoGateUrl from './Logo Gate vermelha.png';

export { logoGrandeMPRJUrl, logoGateUrl };

/**
 * Converte a URL de um asset Vite em string base64 (para jsPDF/ExcelJS).
 * Funciona tanto em dev (URL local) quanto em produção (URL com hash).
 */
export async function carregarImagemBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
