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
  ],
};

export default sidebars;
