import { MdLink } from "react-icons/md";
import type { WidgetCatalogItem } from "../../../types/widget";
import { FastLinkEditor } from "./FastLinkEditor";
import { FastLinkWidget } from "./FastLinkWidget";
import {
  FAST_LINK_INITIAL_OPTIONS,
  getDisplayIconUrl,
  parseEdited,
  parseLinkImageUrl,
  parseLinkName,
  parseLinkUrl,
  parseShowLinkName,
  toLinkHref,
  validateFastLink,
} from "./fastLinkOptions";

export const fastLinkWidget: WidgetCatalogItem = {
  type: "FastLink",
  name: "빠른 링크",
  description: "자주 사용하는 링크를 빠르게 접근할 수 있습니다.",
  icon: MdLink,
  color: "text-blue-200",
  background: "bg-blue-400/20",
  allowMultiple: true,
  initialOptions: FAST_LINK_INITIAL_OPTIONS,
  validate: (options) => validateFastLink(parseLinkUrl(options.linkUrl)),
  render: (options) => {
    const linkUrl = parseLinkUrl(options.linkUrl);

    return (
      <FastLinkWidget
        LinkName={parseLinkName(options.linkName)}
        LinkUrl={toLinkHref(linkUrl)}
        LinkImageUrl={getDisplayIconUrl(linkUrl, parseLinkImageUrl(options.linkImageUrl), parseEdited(options.iconEdited))}
        isShowLinkName={parseShowLinkName(options.isShowLinkName)}
      />
    );
  },
  editor: (props) => <FastLinkEditor {...props} />,
};
