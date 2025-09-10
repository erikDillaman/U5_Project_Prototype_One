# Museum Explorer App - DOM Elements & CSS Documentation

## Overview
This document details all DOM elements and CSS classes used in the "My Decent Docent" Museum Explorer App.

## HTML Structure

### Main Sections
- `<header class="app-header">` - Main application header
- `<main class="main-container">` - Primary content container
- `<section id="card-view" class="card-view active">` - Card grid view section
- `<section id="detailed-view" class="detailed-view">` - Detailed artwork view section

## DOM Element IDs

### Navigation & Views
| Element ID | Purpose | Type |
|------------|---------|------|
| `card-view` | Main card grid view container | `<section>` |
| `detailed-view` | Detailed artwork view container | `<section>` |
| `back-btn` | Navigation button to return to card view | `<button>` |

### Search Functionality
| Element ID | Purpose | Type |
|------------|---------|------|
| `search-input` | Text input for artwork search | `<input>` |
| `search-btn` | Button to trigger search | `<button>` |

### Card Grid
| Element ID | Purpose | Type |
|------------|---------|------|
| `cards-grid` | Container for artwork cards | `<div>` |

### Detailed View Elements
| Element ID | Purpose | Type |
|------------|---------|------|
| `detailed-image` | Large artwork image | `<img>` |
| `detailed-title` | Artwork title | `<h2>` |
| `detailed-price` | Artwork price/value | `<span>` |
| `detailed-rating` | Star rating container | `<div>` |
| `artist-avatars` | Container for artist profile images | `<div>` |
| `detailed-description-text` | Artwork description | `<p>` |

## CSS Classes

### Layout & Structure
| Class Name | Purpose | Applied To |
|------------|---------|------------|
| `.app-header` | Main header styling | Header section |
| `.app-title` | Main application title | H1 element |
| `.app-subtitle` | Application subtitle | P element |
| `.main-container` | Primary content wrapper | Main element |

### View Management
| Class Name | Purpose | Applied To |
|------------|---------|------------|
| `.card-view` | Card grid view container | Section element |
| `.detailed-view` | Detailed view container | Section element |
| `.active` | Shows active view (display: block) | View sections |

### Search Components
| Class Name | Purpose | Applied To |
|------------|---------|------------|
| `.search-container` | Search bar wrapper | Div container |
| `.search-input` | Search text input styling | Input element |
| `.search-btn` | Search button styling | Button element |

### Card Components
| Class Name | Purpose | Applied To |
|------------|---------|------------|
| `.cards-grid` | CSS Grid layout for cards | Div container |
| `.card` | Individual artwork card | Div element |
| `.card-image` | Card image background | Div element |
| `.card-content` | Card text content wrapper | Div element |
| `.card-title` | Card artwork title | Div element |
| `.card-location` | Card location/origin info | Div element |
| `.location-icon` | Location pin icon | Span element |

### Loading States
| Class Name | Purpose | Applied To |
|------------|---------|------------|
| `.skeleton-card` | Loading placeholder card | Div element |
| `.skeleton-image` | Loading placeholder image | Div element |
| `.skeleton-text` | Loading placeholder text | Div element |
| `.skeleton-title` | Loading placeholder title | Div element |
| `.skeleton-location` | Loading placeholder location | Div element |

### Detailed View Components
| Class Name | Purpose | Applied To |
|------------|---------|------------|
| `.back-btn` | Back navigation button | Button element |
| `.back-arrow` | Arrow icon in back button | Span element |
| `.detailed-content` | Main detailed view layout | Div container |
| `.detailed-image-container` | Image wrapper in detailed view | Div container |
| `.detailed-image` | Large artwork image | Img element |
| `.detailed-info` | Information panel in detailed view | Div container |
| `.detailed-title` | Large artwork title | H2 element |
| `.detailed-meta` | Metadata container (price, rating) | Div container |
| `.price-container` | Price information wrapper | Div container |
| `.detailed-price` | Price display | Span element |
| `.original-price` | Original/crossed-out price | Span element |
| `.rating-container` | Rating and reviews wrapper | Div container |
| `.stars` | Star rating container | Div container |
| `.star` | Individual star element | Div element |
| `.star.empty` | Empty/unfilled star | Div element |
| `.rating-text` | "All Reviews" link text | Span element |
| `.artist-info` | Artist information section | Div container |
| `.artist-avatars` | Artist profile images container | Div container |
| `.artist-avatar` | Individual artist profile image | Div element |
| `.detailed-description` | Description text wrapper | Div container |

## CSS Animations

### Loading Animations
| Animation Name | Purpose | Duration |
|----------------|---------|----------|
| `shimmer` | Loading skeleton shimmer effect | 1.5s infinite |
| `pulse` | Loading skeleton pulse effect | 2s infinite |

## Responsive Breakpoints

### Tablet (768px and below)
- Card grid adjusts to smaller minimum width (250px)
- Detailed view switches to vertical layout
- Back button becomes smaller
- Header title reduces in size

### Mobile (480px and below)
- Search container stacks vertically
- Card grid becomes single column
- Reduced padding on main container

## Color Palette

### Primary Colors
- **Primary Blue**: `#667eea` - Buttons, links, focus states
- **Primary Purple**: `#764ba2` - Header gradient
- **Background**: `#f5f5f5` - Main page background
- **Card Background**: `#ffffff` - Card and detailed view backgrounds

### Text Colors
- **Primary Text**: `#333` - Main text color
- **Secondary Text**: `#718096` - Subtitle and metadata
- **Title Text**: `#2d3748` - Card and detailed titles
- **Description Text**: `#4a5568` - Detailed descriptions

### Accent Colors
- **Price Red**: `#e53e3e` - Price display
- **Star Gold**: `#ffd700` - Rating stars
- **Empty Star**: `#e2e8f0` - Unfilled stars

## JavaScript Integration Points

### Event Handlers
- Card click events for navigation to detailed view
- Search input and button events
- Back button navigation
- Enter key support in search input

### Dynamic Content
- Cards are dynamically generated via `createArtworkCard()`
- Detailed view content populated via `populateDetailedView()`
- Loading skeletons shown/hidden programmatically
- Star ratings generated dynamically

### State Management
- View switching managed via `.active` class
- Current artworks stored in `currentArtworks` array
- Current view tracked in `currentView` variable

## Usage Examples

### Creating a New Card
```javascript
const artwork = {
    id: 1,
    title: "Artwork Title",
    location: "Location",
    image: "image-url",
    price: "$999",
    rating: 5,
    description: "Description text"
};
const cardElement = createArtworkCard(artwork);
cardsGrid.appendChild(cardElement);
```

### Switching Views
```javascript
// Show detailed view
showDetailedView(artworkData);

// Return to card view
showCardView();
```

### Managing Loading States
```javascript
// Show loading
showLoadingSkeletons();

// Hide loading and show content
hideLoadingSkeletons();
displayArtworks(artworkArray);
```
