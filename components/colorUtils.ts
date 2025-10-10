/**
 * Calcula a cor média de uma imagem.
 * @param imageUrl O URL da imagem (pode ser um data URL).
 * @returns Uma promessa que resolve para um objeto { r, g, b }.
 */
export const getAverageColor = (imageUrl: string): Promise<{ r: number; g: number; b: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin for non-data URLs to avoid CORS errors with base64 images
    if (!imageUrl.startsWith('data:')) {
      img.crossOrigin = 'Anonymous';
    }

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível obter o contexto do canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      resolve({ r, g, b });
    };
    img.onerror = () => reject(new Error(`Falha ao carregar a imagem.`));
    img.src = imageUrl;
  });
};

/**
 * Determina se o texto deve ser claro ou escuro com base na cor de fundo.
 * @param r - Componente vermelho (0-255).
 * @param g - Componente verde (0-255).
 * @param b - Componente azul (0-255).
 * @returns A cor do texto ('#FFFFFF' para claro, '#4A235A' para escuro).
 */
export const getContrastColor = (r: number, g: number, b: number): string => {
  // Fórmula para luminância percebida
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#4A235A' : '#FFFFFF';
};

/**
 * Escurece uma cor por uma certa quantidade.
 */
const darkenColor = (r: number, g: number, b: number, amount: number) => {
    return {
        r: Math.max(0, r - amount),
        g: Math.max(0, g - amount),
        b: Math.max(0, b - amount)
    };
}

/**
 * Gera uma string de gradiente linear com base em uma cor RGB.
 * @param r - Componente vermelho (0-255).
 * @param g - Componente verde (0-255).
 * @param b - Componente azul (0-255).
 * @returns Uma string de CSS para um gradiente linear.
 */
export const generateGradient = (r: number, g: number, b: number): string => {
    const { r: r2, g: g2, b: b2 } = darkenColor(r, g, b, 30);
    return `linear-gradient(135deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`;
};

/**
 * Converte uma cor hexadecimal para um objeto RGB.
 * @param hex A string da cor hexadecimal (e.g., '#FF5733').
 * @returns Um objeto { r, g, b } ou null se a string for inválida.
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};
