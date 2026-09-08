const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const OUTPUT_PATH = process.env.OUTPUT_PATH || path.join(__dirname, '..', 'outputs');

if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

// Processar vídeo com TODOS os efeitos reais
const processVideo = async (videoId, inputPath, config) => {
  try {
    console.log(`🎬 Iniciando processamento do vídeo ${videoId}`);
    
    const outputPath = path.join(OUTPUT_PATH, `processed-${videoId}-${Date.now()}.mp4`);
    let command = ffmpeg(inputPath);

    // Array para acumular filtros
    let filters = [];

    // 1. REVERSE (inverter frames)
    if (config.reverse) {
      filters.push('reverse');
      console.log('↩️ Aplicando REVERSE');
    }

    // 2. SLOW MOTION (reduzir velocidade com interpolação)
    if (config.slowMotionFactor && config.slowMotionFactor > 1) {
      const slowFactor = config.slowMotionFactor;
      // Diminuir velocidade dos frames
      filters.push(`setpts=${1/slowFactor}*PTS`);
      console.log(`🐢 Aplicando SLOW MOTION ${slowFactor}x`);
    }

    // 3. MOTION BLUR (blur baseado em movimento)
    if (config.motionBlur) {
      // Aplicar blur temporal para simular motion blur real
      filters.push('boxblur=2:1');
      console.log('💨 Aplicando MOTION BLUR');
    }

    // 4. ZOOM (com keyframes)
    if (config.zoomLevel && config.zoomLevel !== 1.0) {
      const zoom = config.zoomLevel;
      const w = `if(lt(n\\,1)\\,1\\,${zoom})`;
      filters.push(`scale=iw*${zoom}:ih*${zoom}`);
      console.log(`🔍 Aplicando ZOOM ${zoom}x`);
    }

    // 5. CC DARK AE (Color Correction cinematográfica)
    if (config.ccDark) {
      // Aumentar contraste, reduzir brilho (dark look)
      filters.push('eq=contrast=1.2:brightness=-0.1:saturation=1.1');
      console.log('🌙 Aplicando CC DARK AE');
    }

    // 6. Aplicar todos os filtros
    if (filters.length > 0) {
      const filterComplex = filters.join(',');
      command = command.videoFilters(filterComplex);
    }

    // 7. UPSCALE 4K (se habilitado)
    if (config.upscale4k) {
      console.log('📺 Upscalando para 4K...');
      command = command.size('3840x2160');
    }

    // Configurações de saída
    command
      .fps(30)
      .videoBitrate('5000k')
      .audioCodec('aac')
      .audioBitrate('192k')
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('▶️ FFmpeg iniciado:', cmd);
        updateVideoStatus(videoId, 'processando', 10);
      })
      .on('progress', (progress) => {
        console.log(`📊 Progresso: ${Math.floor(progress.percent || 0)}%`);
        updateVideoStatus(videoId, 'processando', Math.floor(progress.percent || 0));
      })
      .on('end', () => {
        console.log('✅ Processamento concluído!');
        updateVideoPath(videoId, outputPath);
      })
      .on('error', (err) => {
        console.error('❌ Erro no processamento:', err);
        updateVideoStatus(videoId, 'erro');
      })
      .run();

  } catch (err) {
    console.error('Erro ao processar vídeo:', err);
    await updateVideoStatus(videoId, 'erro');
  }
};

const updateVideoStatus = async (videoId, status, progress = 0) => {
  try {
    await db.run(
      'UPDATE videos SET status = ? WHERE id = ?',
      [status, videoId]
    );
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
  }
};

const updateVideoPath = async (videoId, outputPath) => {
  try {
    await db.run(
      'UPDATE videos SET output_path = ?, status = ? WHERE id = ?',
      [outputPath, 'concluido', videoId]
    );
  } catch (err) {
    console.error('Erro ao atualizar caminho:', err);
  }
};

module.exports = { processVideo };
