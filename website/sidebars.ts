import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    "quick-start",
    {
      type: "category",
      label: "types",
      items: ["types/strict-props-with-children"],
    },
    {
      type: "category",
      label: "utils",
      items: ["utils/ime-enter-handler", "utils/tooltip-viewport-clamp"],
    },
  ],
};

export default sidebars;
