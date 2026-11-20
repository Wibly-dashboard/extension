import { MdLink } from "react-icons/md";
import type { WidgetCatalogItem } from "../../../types/widget";
import { FastLinkEditor } from "./FastLinkEditor";
import { FastLinkWidget } from "./FastLinkWidget";
import { parseLinkImageUrl, parseLinkName, parseLinkUrl, parseShowLinkName, toLinkHref } from "./fastLinkOptions";

export const fastLinkWidget: WidgetCatalogItem = {
  type: "FastLink",
  name: "빠른 링크",
  description: "자주 사용하는 링크를 빠르게 접근할 수 있습니다.",
  icon: MdLink,
  color: "text-blue-200",
  background: "bg-blue-400/20",
  allowMultiple: true,
  render: (options) => (
    <FastLinkWidget
      LinkName={parseLinkName(options.linkName)}
      LinkUrl={toLinkHref(parseLinkUrl(options.linkUrl))}
      LinkImageUrl={parseLinkImageUrl(options.linkImageUrl)}
      isShowLinkName={parseShowLinkName(options.isShowLinkName)}
    />
  ),
  editor: (props) => <FastLinkEditor {...props} />,
};
