// DEPRECATED: This file is kept for backward compatibility
// Components have been moved to individual files
// Please update imports to use the new locations:
//
// General:
//   - Foot → '@/components/Foot'
//   - FeaturedCard → '@/components/FeaturedCard'
//
// Categories (Portfolio):
//   - TitleOfPage → '@/components/Categories/TitleOfPage'
//   - MyCards → '@/components/Categories/MyCards'
//   - HighlightView → '@/components/Categories/HighlightView'
//   - HighlightImageCarousel → '@/components/Categories/HighlightImageCarousel'
//   - InProgress → '@/components/Categories/InProgress'
//   - HorizontalLinks → '@/components/Categories/HorizontalLinks'
//   - OtherSectionsLinks → '@/components/Categories/OtherSectionsLinks'
//
// UI Components:
//   - IframeEmbed → '@/components/UI/IframeEmbed'
//   - UnderConstruction → '@/components/UI/UnderConstruction'
//
// Types:
//   - Highlight, Piece, Pieces, OtherSection → '@/types/portfolio'

// Re-export for backward compatibility
export { Foot } from './Foot';
export { FeaturedCard } from './FeaturedCard';
export { TitleOfPage } from './Categories/TitleOfPage';
export { MyCards } from './Categories/MyCards';
export { HighlightView } from './Categories/HighlightView';
export { HighlightImageCarousel } from './Categories/HighlightImageCarousel';
export { InProgress } from './Categories/InProgress';
export { HorizontalLinks } from './Categories/HorizontalLinks';
export { OtherSectionsLinks } from './Categories/OtherSectionsLinks';
export { IframeEmbed } from './UI/IframeEmbed';
export { UnderConstruction } from './UI/UnderConstruction';
export type { Highlight, Piece, Pieces, OtherSection } from '@/types/portfolio';
