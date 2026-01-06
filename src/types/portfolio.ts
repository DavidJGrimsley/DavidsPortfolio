// Shared types for portfolio pieces

export interface Highlight {
    highlightTitle: string;
    highlightCaption?: string;
    highlightPictures?: string[];
    video?: string;
    description: string;
    code?: string;
}

export interface OtherSection {
    category: string;
    title: string;
    caption: string;
}

export interface Piece {
    title: string;
    displayTitle?: string;
    isFeatured: boolean;
    inProgress: boolean;
    caption: string;
    picture: string;
    gif: string;
    github?: string;
    breakdown: string;
    steam?: string;
    youtubeID?: string;
    site?: string;
    skillsUsed?: string[];
    skillsLearned?: string[];
    highlights?: Highlight[];
    otherSections?: OtherSection[];
}

export interface Pieces {
    [key: string]: Piece[];
    "mobile-apps": Piece[];
    "game-design": Piece[];
    "website-development": Piece[];
    "software-development": Piece[];
}

// Preprocess pieces to ensure highlightPictures is always an array if present
export function normalizePieces(raw: any): Pieces {
    const result: Pieces = { "mobile-apps": [], "game-design": [], "website-development": [], "software-development": [] };
    Object.keys(result).forEach(category => {
        if (Array.isArray(raw[category])) {
            result[category] = raw[category].map((piece: any) => {
                if (Array.isArray(piece.highlights)) {
                    piece.highlights = piece.highlights.map((highlight: any) => {
                        if (highlight.highlightPictures && !Array.isArray(highlight.highlightPictures)) {
                            highlight.highlightPictures = [highlight.highlightPictures];
                        }
                        return highlight;
                    });
                }
                return piece;
            });
        }
    });
    return result;
}
