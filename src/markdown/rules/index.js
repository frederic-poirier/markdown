import { createCodeBlockTransformRule } from './codeBlockRule.js';
import { createGalleryTransformRule } from './galleryRule.js';

const GALLERY_MIN_IMAGES = 3;

export const RENDER_TRANSFORM_RULES = [
    createGalleryTransformRule({ minImages: GALLERY_MIN_IMAGES }),
    createCodeBlockTransformRule()
];
