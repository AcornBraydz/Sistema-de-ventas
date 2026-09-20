const jimp = require('jimp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

async function createIcon() {
  try {
    console.log('Generating minimalist B&W icon...');
    // Create a 256x256 black image
    const image = new jimp(256, 256, '#000000');
    
    // Load a font and write a minimalist 'MC' (Master Control)
    const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
    
    // Draw a white border for contrast
    for (let x = 16; x < 240; x++) {
      for (let y = 16; y < 240; y++) {
        if (x < 24 || x > 232 || y < 24 || y > 232) {
          image.setPixelColor(jimp.rgbaToInt(255, 255, 255, 255), x, y);
        }
      }
    }

    // Print text
    image.print(font, 0, 0, {
      text: 'MC',
      alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
    }, 256, 256);
    
    const pngPath = path.join(__dirname, 'icon.png');
    await image.writeAsync(pngPath);
    
    console.log('Converting to ICO');
    const buf = await pngToIco(pngPath);
    
    fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
    const icoPath = path.join(__dirname, 'build', 'icon.ico');
    fs.writeFileSync(icoPath, buf);
    
    console.log('Icon successfully generated at:', icoPath);
  } catch (error) {
    console.error('Error creating icon:', error);
  }
}

createIcon();
