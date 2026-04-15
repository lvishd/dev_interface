import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, "js/vendor-entry.js"),
            name: "Vendor",
            formats: ["iife"],
            fileName: () => "vendor.iife.js",
        },
        outDir: "js/bundle",
        emptyOutDir: true,
        // Inline everything into one file
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
    },
});
