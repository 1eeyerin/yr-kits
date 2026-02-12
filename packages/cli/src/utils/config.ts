export interface YrKitsConfig {
  aliases: {
    utils?: string;
    types?: string;
    components?: string;
    ui?: string;
    lib?: string;
    hooks?: string;
  };
}

export const DEFAULT_CONFIG: YrKitsConfig = {
  aliases: {
    utils: "src/utils",
    types: "src/types",
    components: "src/components",
    ui: "src/shared/ui",
    lib: "src/shared/lib",
    hooks: "src/hooks",
  },
};
