import sharp from 'sharp';

const assets = [
  'bireysel-terapi',
  'oyun-terapisi',
  'aile-ve-cift-danismanligi',
  'moxo-dikkat-testi-v2'
];

for (const asset of assets) {
  const input = `public/assets/${asset}.webp`;
  const output = `public/assets/${asset}-transparent.png`;
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixelCount = width * height;
  const background = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const isBackgroundColor = (index) => {
    const offset = index * 3;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    return minimum >= 230 && maximum - minimum <= 16;
  };

  const add = (index) => {
    if (background[index] || !isBackgroundColor(index)) return;
    background[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x++) {
    add(x);
    add((height - 1) * width + x);
  }

  for (let y = 0; y < height; y++) {
    add(y * width);
    add(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) add(index - 1);
    if (x < width - 1) add(index + 1);
    if (index >= width) add(index - width);
    if (index < pixelCount - width) add(index + width);
  }

  const rgba = Buffer.allocUnsafe(pixelCount * 4);
  for (let index = 0; index < pixelCount; index++) {
    const source = index * 3;
    const target = index * 4;
    rgba[target] = data[source];
    rgba[target + 1] = data[source + 1];
    rgba[target + 2] = data[source + 2];
    rgba[target + 3] = background[index] ? 0 : 255;
  }

  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);

  console.log(`${output}: ${tail} background pixels made transparent`);
}
