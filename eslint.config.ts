import eslintJS from "@eslint/js";
import { config, configs } from "typescript-eslint";

export default config(eslintJS.configs.recommended, configs.recommended);
