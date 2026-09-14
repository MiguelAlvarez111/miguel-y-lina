import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const source = process.argv[2];
if(!source) throw new Error('Uso: node scripts/prepare-photos.mjs /directorio/con/jpg');
await mkdir('public/photos',{recursive:true});
for(const id of ['0545','0546','6802','6803','6804','6806','6810']){
 for(const width of [480,960,1600]){
  await sharp(resolve(source,`${id}.jpg`)).rotate().resize({width}).webp({quality:82}).toFile(`public/photos/${id}-${width}.webp`);
 }
}
console.log('21 imágenes WebP generadas sin metadatos EXIF.');
