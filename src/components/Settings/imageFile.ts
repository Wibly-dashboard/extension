const MAX_DIMENSION = 1920;

/** 업로드할 수 있는 이미지 형식 */
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif"];

/** 파일 선택 창에 넘기는 accept 값 (허용 형식만 보이도록) */
export const IMAGE_FILE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

/** 허용하지 않는 형식을 업로드했을 때 보여줄 안내 */
export const UNSUPPORTED_IMAGE_MESSAGE = "PNG, JPEG, GIF 이미지만 업로드할 수 있습니다.";

// 투명 배경을 가질 수 있는 형식. JPEG는 투명도를 지원하지 않아 투명한 부분이 검게 채워지므로 WebP로 저장한다
const TRANSPARENT_CAPABLE_TYPES = ["image/png", "image/gif"];

export class UnsupportedImageTypeError extends Error {
  constructor() {
    super(UNSUPPORTED_IMAGE_MESSAGE);
    this.name = "UnsupportedImageTypeError";
  }
}

// 업로드한 이미지를 data URL로 변환. localStorage 용량(약 5MB)에 맞도록 긴 변을 maxDimension 이하로 축소·압축한다
export const imageFileToDataUrl = async (file: File, maxDimension = MAX_DIMENSION): Promise<string> => {
  // 파일 선택 창의 accept는 '모든 파일'로 바꿔 우회할 수 있으므로 여기서 한 번 더 확인한다
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new UnsupportedImageTypeError();

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas 2d context를 사용할 수 없습니다.");

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const outputType = TRANSPARENT_CAPABLE_TYPES.includes(file.type) ? "image/webp" : "image/jpeg";

  return canvas.toDataURL(outputType, 0.85);
};
