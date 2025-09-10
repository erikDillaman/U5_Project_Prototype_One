// Museum Explorer App - Main JavaScript File

// DOM Elements
const cardView = document.getElementById('card-view');
const detailedView = document.getElementById('detailed-view');
const cardsGrid = document.getElementById('cards-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const backBtn = document.getElementById('back-btn');

// Detailed view elements
const detailedImage = document.getElementById('detailed-image');
const detailedTitle = document.getElementById('detailed-title');
const detailedPrice = document.getElementById('detailed-price');
const detailedRating = document.getElementById('detailed-rating');
const artistAvatars = document.getElementById('artist-avatars');
const detailedDescriptionText = document.getElementById('detailed-description-text');

// App State
let currentArtworks = [];
let currentView = 'card'; // 'card' or 'detailed'

// Metropolitan Museum API Configuration
const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// App Initialization
function initializeApp() {
    console.log('Museum Explorer App initialized');
    loadRandomArtworks();
}

// Event Listeners
function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Back button
    backBtn.addEventListener('click', showCardView);

    // Card click handlers will be added dynamically when cards are created
}

// View Management
function showCardView() {
    cardView.classList.add('active');
    detailedView.classList.remove('active');
    currentView = 'card';
}

function showDetailedView(artwork) {
    cardView.classList.remove('active');
    detailedView.classList.add('active');
    currentView = 'detailed';
    populateDetailedView(artwork);
}

// API Functions (Placeholder implementations)
async function loadRandomArtworks() {
    try {
        // TODO: Implement actual API call to Metropolitan Museum
        console.log('Loading random artworks...');
        
        // For now, show loading skeletons
        showLoadingSkeletons();
        
        // Simulate API delay
        setTimeout(() => {
            // TODO: Replace with actual API data
            const mockArtworks = generateMockArtworks();
            displayArtworks(mockArtworks);
        }, 2000);
        
    } catch (error) {
        console.error('Error loading artworks:', error);
        showErrorMessage('Failed to load artworks. Please try again.');
    }
}

async function searchArtworks(query) {
    try {
        console.log('Searching for:', query);
        
        // Show loading state
        showLoadingSkeletons();
        
        // TODO: Implement actual search API call
        setTimeout(() => {
            const mockResults = generateMockArtworks(query);
            displayArtworks(mockResults);
        }, 1500);
        
    } catch (error) {
        console.error('Error searching artworks:', error);
        showErrorMessage('Search failed. Please try again.');
    }
}

// UI Functions
function showLoadingSkeletons() {
    // Skeleton cards are already in HTML, just ensure they're visible
    const skeletonCards = document.querySelectorAll('.skeleton-card');
    skeletonCards.forEach(card => {
        card.style.display = 'block';
    });
}

function hideLoadingSkeletons() {
    const skeletonCards = document.querySelectorAll('.skeleton-card');
    skeletonCards.forEach(card => {
        card.style.display = 'none';
    });
}

function displayArtworks(artworks) {
    hideLoadingSkeletons();
    currentArtworks = artworks;
    
    // Clear existing non-skeleton cards
    const existingCards = cardsGrid.querySelectorAll('.card:not(.skeleton-card)');
    existingCards.forEach(card => card.remove());
    
    // Create new cards
    artworks.forEach(artwork => {
        const cardElement = createArtworkCard(artwork);
        cardsGrid.appendChild(cardElement);
    });
}

function createArtworkCard(artwork) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-image" style="background-image: url('${artwork.image}')"></div>
        <div class="card-content">
            <div class="card-title">${artwork.title}</div>
            <div class="card-location">
                <span class="location-icon">📍</span>
                ${artwork.location}
            </div>
        </div>
    `;
    
    // Add click handler
    card.addEventListener('click', () => {
        showDetailedView(artwork);
    });
    
    return card;
}

function populateDetailedView(artwork) {
    detailedImage.src = artwork.image;
    detailedImage.alt = artwork.title;
    detailedTitle.textContent = artwork.title;
    detailedPrice.textContent = artwork.price || 'Priceless';
    
    // Create rating stars
    createRatingStars(artwork.rating || 5);
    
    // Add artist info (placeholder)
    artistAvatars.innerHTML = '<div class="artist-avatar" style="background-image: url(\'https://via.placeholder.com/40\')"></div>';
    
    // Add description
    detailedDescriptionText.textContent = artwork.description || 'A magnificent piece from the Metropolitan Museum of Art collection.';
}

function createRatingStars(rating) {
    detailedRating.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('div');
        star.className = i <= rating ? 'star' : 'star empty';
        detailedRating.appendChild(star);
    }
}

// Search Handler
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        searchArtworks(query);
    } else {
        loadRandomArtworks();
    }
}

// Utility Functions
function showErrorMessage(message) {
    // TODO: Implement proper error UI
    console.error(message);
    alert(message);
}

function generateMockArtworks(searchQuery = '') {
    // Mock data for development - replace with actual API integration
    const mockData = [
        {
            id: 1,
            title: 'Mountain Peak Red Sky',
            location: 'Vietnam',
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            price: '$959',
            rating: 5,
            description: 'A breathtaking landscape painting capturing the serene beauty of Vietnamese mountains at sunset.'
        },
        {
            id: 2,
            title: 'Mountain of Cloud Tops',
            location: 'America',
            image: 'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=400&h=300&fit=crop',
            price: '$1,200',
            rating: 4,
            description: 'An ethereal depiction of mountain peaks emerging through layers of clouds.'
        },
        {
            id: 3,
            title: 'Mountain Valley Layered',
            location: 'Vietnam',
            image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
            price: '$800',
            rating: 5,
            description: 'A stunning portrayal of layered mountain valleys in the early morning light.'
        },
        {
            id: 4,
            title: 'Twin Pine Mountains',
            location: 'America',
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            price: '$1,100',
            rating: 4,
            description: 'Twin mountain peaks adorned with ancient pine trees, symbolizing endurance and tranquility.'
        }
    ];
    
    if (searchQuery) {
        return mockData.filter(artwork => 
            artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            artwork.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return mockData;
}

// Export functions for potential module use
window.MuseumApp = {
    loadRandomArtworks,
    searchArtworks,
    showCardView,
    showDetailedView
};
