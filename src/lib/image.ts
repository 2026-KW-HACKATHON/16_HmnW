export async function resizeShopImage(file: Blob) {
  const b = await createImageBitmap(file, { imageOrientation: 'from-image' }),
    s = Math.min(1, 480 / Math.max(b.width, b.height)),
    c = document.createElement('canvas');
  c.width = Math.round(b.width * s);
  c.height = Math.round(b.height * s);
  c.getContext('2d')!.drawImage(b, 0, 0, c.width, c.height);
  b.close();
  let quality = 0.8,
    data = c.toDataURL('image/jpeg', quality);
  while (data.length > 80000 && quality > 0.3) {
    quality -= 0.1;
    data = c.toDataURL('image/jpeg', quality);
  }
  if (data.length > 80000)
    throw new Error('사진 용량을 80KB 이하로 줄이지 못했어요. 더 작은 사진을 선택해 주세요.');
  return data;
}
