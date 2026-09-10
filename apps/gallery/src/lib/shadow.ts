// The ThemeShadow page needs the continuously driven recipe at runtime while the token layer
// needs it at three fixed depths at build time, so both read one transcription.
export { dropShadowRecipe } from '../../../../scripts/tokens/drop-shadow-recipe.mjs';
