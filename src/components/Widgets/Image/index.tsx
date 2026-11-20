import { MdImage } from "react-icons/md";
import type { WidgetCatalogItem } from "../../../types/widget";
import { ImageSourcePicker } from "../../WidgetEditor/ImageSourcePicker";
import { RangeSlider } from "../../WidgetEditor/RangeSlider";
import { ImageBlock } from "./ImageBlock";
import {
  DEFAULT_IMAGE_URL,
  IMAGE_SIZE_RANGE,
  IMAGE_UPLOAD_MAX_DIMENSION,
  parseImageSize,
  parseImageUrl,
} from "./imageOptions";

export const imageWidget: WidgetCatalogItem = {
  type: "image",
  name: "이미지",
  description: "좋아하는 사진을 대시보드에 걸어 둡니다.",
  icon: MdImage,
  color: "text-pink-200",
  background: "bg-pink-400/20",
  allowMultiple: true,
  render: (options) => (
    <ImageBlock
      imageUrl={parseImageUrl(options.imageUrl)}
      altText="이미지 위젯"
      width={parseImageSize(options.width)}
      height={parseImageSize(options.height)}
    />
  ),
  editor: ({ options, onChange }) => (
    <>
      <ImageSourcePicker
        label="이미지"
        value={parseImageUrl(options.imageUrl)}
        onChange={(imageUrl) => onChange({ imageUrl })}
        onReset={() => onChange({ imageUrl: DEFAULT_IMAGE_URL })}
        maxDimension={IMAGE_UPLOAD_MAX_DIMENSION}
      />
      <RangeSlider
        label="너비"
        {...IMAGE_SIZE_RANGE}
        value={parseImageSize(options.width)}
        onChange={(width) => onChange({ width: parseImageSize(width) })}
        formatValue={(width) => `${width}px`}
      />
      <RangeSlider
        label="높이"
        {...IMAGE_SIZE_RANGE}
        value={parseImageSize(options.height)}
        onChange={(height) => onChange({ height: parseImageSize(height) })}
        formatValue={(height) => `${height}px`}
      />
    </>
  ),
};
