// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    } else {
        navbar.style.backgroundColor = 'white';
    }
});

// Initialize real-time updates
document.addEventListener('DOMContentLoaded', () => {
    basketballService.startLiveUpdates();
    initializeLiveScores();
    initializePlayerStats();
    initializeTeamComparison();
    initializeSchedule();

    // Initialize 3D model
    init3DModel();

    // Error handling wrapper for API calls
    const handleApiError = (error, elementId, fallbackMessage) => {
        console.error(error);
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="error-message">
                    <p>${fallbackMessage}</p>
                    <button onclick="retryLoad('${elementId}')">Retry</button>
                </div>
            `;
        }
    };

    // Initialize live scores
    const initializeLiveScores = async () => {
        try {
            const scoresContainer = document.querySelector('.live-scores');
            if (!scoresContainer) return;

            basketballService.subscribe('liveGamesUpdated', games => {
                if (!games || games.length === 0) {
                    scoresContainer.innerHTML = '<p class="no-games">No live games at the moment</p>';
                    return;
                }

                scoresContainer.innerHTML = games.map(game => `
                    <div class="score-card">
                        <div class="team home">
                            <img src="https://cdn.nba.com/logos/nba/${game.homeTeam.id}/global/L/logo.svg" 
                                alt="${game.homeTeam.name}" 
                                onerror="this.src='assets/placeholder-team.svg'">
                            <span class="team-name">${game.homeTeam.name}</span>
                            <span class="score">${game.homeScore}</span>
                        </div>
                        <div class="vs">VS</div>
                        <div class="team away">
                            <img src="https://cdn.nba.com/logos/nba/${game.awayTeam.id}/global/L/logo.svg" 
                                alt="${game.awayTeam.name}"
                                onerror="this.src='assets/placeholder-team.svg'">
                            <span class="team-name">${game.awayTeam.name}</span>
                            <span class="score">${game.awayScore}</span>
                        </div>
                    </div>
                `).join('');
            });

            basketballService.startLiveUpdates();
        } catch (error) {
            handleApiError(error, 'live-scores', 'Unable to load live scores. Please try again later.');
        }
    };

    // Enhanced Team Cards
    function initializeTeamCards() {
        const cards = document.querySelectorAll('.team-card');
        
        cards.forEach((card, index) => {
            // Add staggered animation delay
            card.style.animationDelay = `${index * 0.2}s`;
            
            // Add loading state
            card.classList.add('loading');
            
            // Handle image load
            const img = card.querySelector('img');
            if (img) {
                img.addEventListener('load', () => {
                    card.classList.remove('loading');
                });
                
                img.addEventListener('error', () => {
                    img.src = 'assets/placeholder-team.svg';
                    card.classList.remove('loading');
                });
            }

            // Stats animation
            const statNumber = card.querySelector('.number');
            if (statNumber) {
                const finalNumber = parseInt(statNumber.textContent);
                statNumber.setAttribute('data-target', finalNumber);
                statNumber.textContent = '0';
            }

            // 3D hover effect
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * 10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `
                    perspective(1000px)
                    rotateX(${-rotateX}deg)
                    rotateY(${rotateY}deg)
                    translateZ(20px)
                `;
            });

            // Reset transform on mouse leave
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });

            // Smooth stat number animation
            function animateStats() {
                const statNumber = card.querySelector('.number');
                if (statNumber && card.classList.contains('visible')) {
                    const target = parseInt(statNumber.getAttribute('data-target'));
                    const current = parseInt(statNumber.textContent);
                    const increment = target / 30; // Animate over 30 frames
                    
                    if (current < target) {
                        statNumber.textContent = Math.ceil(current + increment);
                        setTimeout(animateStats, 50);
                    } else {
                        statNumber.textContent = target;
                    }
                }
            }

            // Intersection Observer for scroll animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        card.classList.add('visible');
                        animateStats();
                        observer.unobserve(card);
                    }
                });
            }, {
                threshold: 0.2
            });

            observer.observe(card);
        });
    }

    initializeTeamCards();
    initializeLiveScores();
    initializePlayerStats();
    initializeTeamComparison();
    initializeSchedule();

    // Team Photos Enhancement
    function initializeTeamPhotos() {
        const photos = document.querySelectorAll('.team-photos');
        let zoomOverlay = document.createElement('div');
        zoomOverlay.className = 'zoom-overlay';
        document.body.appendChild(zoomOverlay);

        photos.forEach(photo => {
            // Handle loading state
            const img = photo.querySelector('img');
            if (img.complete) {
                photo.classList.remove('loading');
            }

            // Zoom functionality
            photo.addEventListener('click', () => {
                if (!photo.classList.contains('zoomed')) {
                    // Zoom in
                    photo.classList.add('zoomed');
                    zoomOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';

                    // Close on overlay click
                    const closeZoom = () => {
                        photo.classList.remove('zoomed');
                        zoomOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                        zoomOverlay.removeEventListener('click', closeZoom);
                    };

                    zoomOverlay.addEventListener('click', closeZoom);
                    photo.addEventListener('click', closeZoom);
                }
            });

            // Smooth hover effects
            photo.addEventListener('mouseenter', () => {
                const caption = photo.querySelector('.photo-caption');
                if (caption) {
                    caption.style.transform = 'translateY(0)';
                }
            });

            photo.addEventListener('mouseleave', () => {
                const caption = photo.querySelector('.photo-caption');
                if (caption && !photo.classList.contains('zoomed')) {
                    caption.style.transform = 'translateY(100%)';
                }
            });

            // Intersection Observer for reveal animation
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            photo.style.opacity = '1';
                            photo.style.transform = 'translateY(0)';
                            observer.unobserve(photo);
                        }
                    });
                },
                {
                    threshold: 0.2,
                    rootMargin: '50px'
                }
            );

            // Initial state for animation
            photo.style.opacity = '0';
            photo.style.transform = 'translateY(30px)';
            photo.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

            observer.observe(photo);
        });

        // Handle escape key for zoom
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const zoomedPhoto = document.querySelector('.team-photos.zoomed');
                if (zoomedPhoto) {
                    zoomedPhoto.classList.remove('zoomed');
                    zoomOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    }

    initializeTeamPhotos();
});

// Retry loading function
window.retryLoad = async (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
        if (elementId === 'live-scores') {
            await initializeLiveScores();
        }
        // Add other retry cases as needed
    }
};

// Live Scores Section
function initializeLiveScores() {
    const scoresContainer = document.querySelector('.live-scores');
    
    basketballService.subscribe('liveGamesUpdated', games => {
        scoresContainer.innerHTML = '';
        games.forEach(game => {
            const scoreCard = document.createElement('div');
            scoreCard.className = 'score-card';
            scoreCard.innerHTML = `
                <div class="team home">
                    <span class="team-name">${game.homeTeam}</span>
                    <span class="score">${game.homeScore}</span>
                </div>
                <div class="vs">VS</div>
                <div class="team away">
                    <span class="team-name">${game.awayTeam}</span>
                    <span class="score">${game.awayScore}</span>
                </div>
                <div class="game-info">
                    <span class="period">Q${game.period}</span>
                    <span class="status">${game.status}</span>
                </div>
            `;
            scoresContainer.appendChild(scoreCard);
        });

        if (games.length === 0) {
            scoresContainer.innerHTML = '<p class="no-games">No live games at the moment</p>';
        }
    });

    // Initial load
    basketballService.getLiveGames();
}

// Player Statistics Section
function initializePlayerStats() {
    const searchInput = document.querySelector('#playerSearch');
    const statsTable = document.querySelector('#playerStatsTable tbody');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                basketballService.getPlayerStats(query);
            }
        }, 300);
    });

    basketballService.subscribe('playerStatsUpdated', players => {
        statsTable.innerHTML = '';
        players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${player.team}</td>
                <td>${player.position}</td>
                <td>${player.ppg}</td>
                <td>${player.rpg}</td>
                <td>${player.apg}</td>
                <td>${player.fgPercentage}%</td>
            `;
            statsTable.appendChild(row);
        });

        if (players.length === 0) {
            statsTable.innerHTML = '<tr><td colspan="7">No players found</td></tr>';
        }
    });
}

// Team Comparison Section
function initializeTeamComparison() {
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    
    async function updateComparison() {
        if (!team1Select.value || !team2Select.value) return;
        
        const team1Stats = await basketballService.getTeamStats(team1Select.value);
        const team2Stats = await basketballService.getTeamStats(team2Select.value);
        
        if (!team1Stats || !team2Stats) return;

        updateComparisonVisuals(team1Stats, team2Stats);
    }

    team1Select.addEventListener('change', updateComparison);
    team2Select.addEventListener('change', updateComparison);
}

function updateComparisonVisuals(team1Stats, team2Stats) {
    const comparisonResult = document.getElementById('comparisonResult');
    const maxStats = {
        ppg: Math.max(team1Stats.ppg, team2Stats.ppg),
        rpg: Math.max(team1Stats.rpg, team2Stats.rpg),
        apg: Math.max(team1Stats.apg, team2Stats.apg),
        winRate: Math.max(team1Stats.winRate, team2Stats.winRate)
    };

    const rows = comparisonResult.querySelectorAll('.stat-row');
    rows[0].querySelector('.team1-stat').style.width = `${(team1Stats.ppg / maxStats.ppg) * 100}%`;
    rows[0].querySelector('.team2-stat').style.width = `${(team2Stats.ppg / maxStats.ppg) * 100}%`;
    rows[0].querySelector('.team1-stat').setAttribute('data-value', team1Stats.ppg);
    rows[0].querySelector('.team2-stat').setAttribute('data-value', team2Stats.ppg);

    rows[1].querySelector('.team1-stat').style.width = `${(team1Stats.rpg / maxStats.rpg) * 100}%`;
    rows[1].querySelector('.team2-stat').style.width = `${(team2Stats.rpg / maxStats.rpg) * 100}%`;
    rows[1].querySelector('.team1-stat').setAttribute('data-value', team1Stats.rpg);
    rows[1].querySelector('.team2-stat').setAttribute('data-value', team2Stats.rpg);

    rows[2].querySelector('.team1-stat').style.width = `${(team1Stats.apg / maxStats.apg) * 100}%`;
    rows[2].querySelector('.team2-stat').style.width = `${(team2Stats.apg / maxStats.apg) * 100}%`;
    rows[2].querySelector('.team1-stat').setAttribute('data-value', team1Stats.apg);
    rows[2].querySelector('.team2-stat').setAttribute('data-value', team2Stats.apg);

    rows[3].querySelector('.team1-stat').style.width = `${(team1Stats.winRate / maxStats.winRate) * 100}%`;
    rows[3].querySelector('.team2-stat').style.width = `${(team2Stats.winRate / maxStats.winRate) * 100}%`;
    rows[3].querySelector('.team1-stat').setAttribute('data-value', `${(team1Stats.winRate * 100).toFixed(1)}%`);
    rows[3].querySelector('.team2-stat').setAttribute('data-value', `${(team2Stats.winRate * 100).toFixed(1)}%`);
}

// Schedule Section
function initializeSchedule() {
    basketballService.subscribe('scheduleUpdated', games => {
        const scheduleGrid = document.querySelector('.schedule-grid');
        scheduleGrid.innerHTML = '';
        
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            const gameDate = new Date(game.date);
            
            gameCard.innerHTML = `
                <div class="game-teams">${game.homeTeam} vs ${game.awayTeam}</div>
                <div class="game-info">
                    <p><i class="far fa-calendar"></i> ${gameDate.toLocaleDateString()}</p>
                    <p><i class="far fa-clock"></i> ${gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${game.arena}</p>
                </div>
                <button class="book-ticket">Book Tickets</button>
            `;
            
            scheduleGrid.appendChild(gameCard);
        });

        if (games.length === 0) {
            scheduleGrid.innerHTML = '<p class="no-games">No upcoming games scheduled</p>';
        }
    });

    // Initial load
    basketballService.getUpcomingGames();
}

// Photo Gallery Lightbox
const galleryGrid = document.getElementById('galleryGrid');
let lightbox = null;

function createLightbox() {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <img src="" alt="Lightbox Image">
    `;
    document.body.appendChild(lightbox);

    const closeBtn = lightbox.querySelector('.lightbox-close');
    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });
}

createLightbox();

galleryGrid.addEventListener('click', (e) => {
    const galleryItem = e.target.closest('.gallery-item');
    if (!galleryItem) return;

    const imgSrc = galleryItem.dataset.src;
    const lightboxImg = lightbox.querySelector('img');
    lightboxImg.src = imgSrc;
    lightbox.classList.add('active');
});

// Newsletter Subscription
const newsletterForm = document.getElementById('newsletterForm');
const emailInput = document.getElementById('emailInput');
const subscriptionMessage = document.getElementById('subscriptionMessage');

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;

    // Simulate API call
    setTimeout(() => {
        subscriptionMessage.textContent = 'Thank you for subscribing! You will receive our newsletter soon.';
        subscriptionMessage.className = 'success';
        emailInput.value = '';
        
        setTimeout(() => {
            subscriptionMessage.textContent = '';
        }, 3000);
    }, 500);
});

// Game Schedule and Ticket Booking
const teamFilter = document.getElementById('teamFilter');
const monthFilter = document.getElementById('monthFilter');
const scheduleGrid = document.querySelector('.schedule-grid');

function filterGames() {
    const selectedTeam = teamFilter.value.toLowerCase();
    const selectedMonth = monthFilter.value;
    const games = scheduleGrid.getElementsByClassName('game-card');

    Array.from(games).forEach(game => {
        const teams = game.querySelector('.game-teams').textContent.toLowerCase();
        const date = new Date(game.querySelector('.game-info p:first-child').textContent.split('i>')[1]);
        const showByTeam = !selectedTeam || teams.includes(selectedTeam);
        const showByMonth = !selectedMonth || (date.getMonth() + 1) === parseInt(selectedMonth);
        game.style.display = showByTeam && showByMonth ? '' : 'none';
    });
}

teamFilter.addEventListener('change', filterGames);
monthFilter.addEventListener('change', filterGames);

// Ticket Booking Modal
const bookingButtons = document.querySelectorAll('.book-ticket');
let bookingModal = null;

function createBookingModal() {
    bookingModal = document.createElement('div');
    bookingModal.className = 'modal';
    bookingModal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Book Tickets</h3>
            <form id="bookingForm">
                <div class="form-group">
                    <label>Number of Tickets:</label>
                    <input type="number" min="1" max="10" value="1" required>
                </div>
                <div class="form-group">
                    <label>Seating Section:</label>
                    <select required>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="vip">VIP</option>
                    </select>
                </div>
                <button type="submit">Confirm Booking</button>
            </form>
        </div>
    `;
    document.body.appendChild(bookingModal);

    const closeBtn = bookingModal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => bookingModal.style.display = 'none');

    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) bookingModal.style.display = 'none';
    });

    const bookingForm = bookingModal.querySelector('#bookingForm');
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Booking confirmed! You will receive an email with your tickets.');
        bookingModal.style.display = 'none';
    });
}

createBookingModal();

bookingButtons.forEach(button => {
    button.addEventListener('click', () => {
        bookingModal.style.display = 'block';
    });
});

// Basketball Court Finder
const locationInput = document.getElementById('locationInput');
const findCourtsBtn = document.getElementById('findCourts');
const courtsList = document.getElementById('courtsList');

// Sample court data (in real app, this would come from an API)
const sampleCourts = [
    {
        name: "Community Center Court",
        address: "123 Main St",
        type: "Indoor",
        hours: "6 AM - 10 PM",
        rating: 4.5
    },
    {
        name: "City Park Courts",
        address: "456 Park Ave",
        type: "Outdoor",
        hours: "24/7",
        rating: 4.2
    },
    {
        name: "YMCA Basketball Court",
        address: "789 Sports Way",
        type: "Indoor",
        hours: "7 AM - 9 PM",
        rating: 4.8
    }
];

function displayCourts() {
    courtsList.innerHTML = '';
    sampleCourts.forEach(court => {
        const courtItem = document.createElement('div');
        courtItem.className = 'court-item';
        courtItem.innerHTML = `
            <h3>${court.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${court.address}</p>
            <p><i class="fas fa-basketball-ball"></i> ${court.type}</p>
            <p><i class="far fa-clock"></i> ${court.hours}</p>
            <p><i class="fas fa-star"></i> ${court.rating}/5.0</p>
        `;
        courtsList.appendChild(courtItem);
    });
}

findCourtsBtn.addEventListener('click', () => {
    const location = locationInput.value;
    if (location) {
        // In a real app, we would make an API call here
        displayCourts();
    } else {
        alert('Please enter a location');
    }
});

// Initialize map (in a real app, we would use Google Maps or similar)
const courtsMap = document.getElementById('courtsMap');
courtsMap.innerHTML = '<div style="padding: 1rem; text-align: center;">Map would be displayed here</div>';

// Scroll reveal animation
function initScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('stat-number')) {
                    animateNumber(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('scroll-reveal');
        observer.observe(section);
    });

    // Observe team cards
    document.querySelectorAll('.team-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
        observer.observe(card);
    });

    // Observe stats
    document.querySelectorAll('.stat-number').forEach(stat => {
        observer.observe(stat);
    });
}

// Animate numbers
function animateNumber(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const updateNumber = () => {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = target.toLocaleString();
        }
    };

    updateNumber();
}

// Button hover effect
function initButtonEffects() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            button.style.setProperty('--x', `${x}px`);
            button.style.setProperty('--y', `${y}px`);
        });
    });
}

// Navigation highlight effect
function initNavHighlight() {
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
}

// Enhanced Hero Button Effects
function initializeHeroButtons() {
    const buttons = document.querySelectorAll('.hero-buttons .btn');
    
    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            button.style.setProperty('--x', `${x}px`);
            button.style.setProperty('--y', `${y}px`);
        });

        // Add click effect
        button.addEventListener('click', function(e) {
            let ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            let x = e.clientX - e.target.offsetLeft;
            let y = e.clientY - e.target.offsetTop;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Initialize all animations
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initButtonEffects();
    initNavHighlight();
    initializeHeroButtons();
    
    // Add scroll-reveal class to existing elements
    document.querySelectorAll('.team-card, .score-card, .section').forEach(el => {
        el.classList.add('scroll-reveal');
    });
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Smooth Scrolling and Section Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Get navigation elements once
    const navLinks = document.querySelectorAll('a[href^="#"]');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    const sections = document.querySelectorAll('section[id]');
    
    // Smooth scroll to sections
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.getElementById(targetId.slice(1));
            
            if (targetSection) {
                // Smooth scroll
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Update active states
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
                
                // Close mobile menu if open
                mobileMenuBtn.classList.remove('active');
                navLinksContainer.classList.remove('show');
                
                // Highlight section
                highlightSection(targetId);
            }
        });
    });

    // Mobile menu toggle
    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navLinksContainer.classList.toggle('show');
    });

    // Handle scroll for active section
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const sectionId = section.getAttribute('id');
                updateActiveLink(sectionId);
            }
        });
    });
}

// Fix section navigation
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navigationLinks = document.querySelectorAll('a[href^="#"]');
    
    // Add click event listeners to all hash links
    navigationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent default anchor behavior
            e.preventDefault();
            
            // Get the target section ID
            const targetId = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (targetId === '#') return;
            
            // Find the target section
            const targetSection = document.querySelector(targetId);
            
            // If target section exists, scroll to it
            if (targetSection) {
                // Scroll smoothly to the section
                window.scrollTo({
                    top: targetSection.offsetTop - 80, // Offset for fixed header
                    behavior: 'smooth'
                });
                
                // Update active class in navigation
                navigationLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
            
            return false;
        });
    });
    
    // Track scroll position to highlight active section
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY + 200; // Add offset for better UX
        
        // Check each section
        document.querySelectorAll('section[id]').forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            // If current scroll position is within this section
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remove active class from all links
                navigationLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to corresponding nav link
                const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    });
});

// Team Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Team data
    const teamsData = {
        warriors: {
            name: 'Golden State Warriors',
            conference: 'Western Conference',
            founded: 1946,
            arena: 'Chase Center',
            championships: 7,
            wins: 39,
            losses: 21,
            description: 'The Golden State Warriors are an American professional basketball team based in San Francisco. The Warriors compete in the National Basketball Association (NBA), as a member of the league\'s Western Conference Pacific Division.',
            headCoach: 'Steve Kerr',
            owner: 'Joe Lacob',
            roster: [
                { name: 'Stephen Curry', number: 30, position: 'PG' },
                { name: 'Klay Thompson', number: 11, position: 'SG' },
                { name: 'Draymond Green', number: 23, position: 'PF' },
                { name: 'Andrew Wiggins', number: 22, position: 'SF' },
                { name: 'Kevon Looney', number: 5, position: 'C' },
                { name: 'Jordan Poole', number: 3, position: 'SG' },
                { name: 'Jonathan Kuminga', number: "00", position: 'PF' },
                { name: 'Moses Moody', number: 4, position: 'SG' }
            ]
        },
        lakers: {
            name: 'Los Angeles Lakers',
            conference: 'Western Conference',
            founded: 1947,
            arena: 'Crypto.com Arena',
            championships: 17,
            wins: 31,
            losses: 29,
            description: 'The Los Angeles Lakers are an American professional basketball team based in Los Angeles. The Lakers compete in the National Basketball Association (NBA) as a member of the league\'s Western Conference Pacific Division.',
            headCoach: 'Darvin Ham',
            owner: 'Jeanie Buss',
            roster: [
                { name: 'LeBron James', number: 6, position: 'SF' },
                { name: 'Anthony Davis', number: 3, position: 'PF' },
                { name: 'D\'Angelo Russell', number: 1, position: 'PG' },
                { name: 'Austin Reaves', number: 15, position: 'SG' },
                { name: 'Rui Hachimura', number: 28, position: 'PF' },
                { name: 'Jarred Vanderbilt', number: 2, position: 'PF' },
                { name: 'Taurean Prince', number: 12, position: 'SF' },
                { name: 'Gabe Vincent', number: 7, position: 'PG' }
            ]
        },
        celtics: {
            name: 'Boston Celtics',
            conference: 'Eastern Conference',
            founded: 1946,
            arena: 'TD Garden',
            championships: 18,
            wins: 48,
            losses: 12,
            description: 'The Boston Celtics are an American professional basketball team based in Boston. The Celtics compete in the National Basketball Association (NBA) as a member of the league\'s Eastern Conference Atlantic Division.',
            headCoach: 'Joe Mazzulla',
            owner: 'Boston Basketball Partners',
            roster: [
                { name: 'Jayson Tatum', number: 0, position: 'SF' },
                { name: 'Jaylen Brown', number: 7, position: 'SG' },
                { name: 'Kristaps Porzingis', number: 8, position: 'C' },
                { name: 'Jrue Holiday', number: 4, position: 'PG' },
                { name: 'Derrick White', number: 9, position: 'SG' },
                { name: 'Al Horford', number: 42, position: 'C' },
                { name: 'Payton Pritchard', number: 11, position: 'PG' },
                { name: 'Sam Hauser', number: 30, position: 'SF' }
            ]
        },
        nets: {
            name: 'Brooklyn Nets',
            conference: 'Eastern Conference',
            founded: 1967,
            arena: 'Barclays Center',
            championships: 0,
            wins: 25,
            losses: 35,
            description: 'The Brooklyn Nets are an American professional basketball team based in the New York City borough of Brooklyn. The Nets compete in the National Basketball Association (NBA) as a member of the league\'s Eastern Conference Atlantic Division.',
            headCoach: 'Jacque Vaughn',
            owner: 'Joe Tsai',
            roster: [
                { name: 'Dennis Smith Jr.', number: 4, position: 'PG' },
                { name: 'Cameron Johnson', number: 2, position: 'SF' },
                { name: 'Mikal Bridges', number: 1, position: 'SF' },
                { name: 'Nic Claxton', number: 33, position: 'C' },
                { name: 'Cam Thomas', number: 24, position: 'SG' },
                { name: 'Ben Simmons', number: 10, position: 'PG' },
                { name: 'Dorian Finney-Smith', number: 28, position: 'PF' },
                { name: 'Royce O\'Neale', number: "00", position: 'SF' }
            ]
        },
        heat: {
            name: 'Miami Heat',
            conference: 'Eastern Conference',
            founded: 1988,
            arena: 'Kaseya Center',
            championships: 3,
            wins: 31,
            losses: 29,
            description: 'The Miami Heat are an American professional basketball team based in Miami. The Heat compete in the National Basketball Association (NBA) as a member of the league\'s Eastern Conference Southeast Division.',
            headCoach: 'Erik Spoelstra',
            owner: 'Micky Arison',
            roster: [
                { name: 'Jimmy Butler', number: 22, position: 'SF' },
                { name: 'Bam Adebayo', number: 13, position: 'C' },
                { name: 'Tyler Herro', number: 14, position: 'SG' },
                { name: 'Jaime Jaquez Jr.', number: 11, position: 'SF' },
                { name: 'Terry Rozier', number: 2, position: 'PG' },
                { name: 'Duncan Robinson', number: 55, position: 'SG' },
                { name: 'Caleb Martin', number: 16, position: 'SF' },
                { name: 'Kevin Love', number: 42, position: 'PF' }
            ]
        },
        bucks: {
            name: 'Milwaukee Bucks',
            conference: 'Eastern Conference',
            founded: 1968,
            arena: 'Fiserv Forum',
            championships: 2,
            wins: 39,
            losses: 21,
            description: 'The Milwaukee Bucks are an American professional basketball team based in Milwaukee. The Bucks compete in the National Basketball Association (NBA) as a member of the league\'s Eastern Conference Central Division.',
            headCoach: 'Doc Rivers',
            owner: 'Wes Edens, Marc Lasry',
            roster: [
                { name: 'Giannis Antetokounmpo', number: 34, position: 'PF' },
                { name: 'Damian Lillard', number: 0, position: 'PG' },
                { name: 'Brook Lopez', number: 11, position: 'C' },
                { name: 'Khris Middleton', number: 22, position: 'SF' },
                { name: 'Bobby Portis', number: 9, position: 'PF' },
                { name: 'Malik Beasley', number: 5, position: 'SG' },
                { name: 'Pat Connaughton', number: 24, position: 'SG' },
                { name: 'Jae Crowder', number: 99, position: 'PF' }
            ]
        }
    };
    
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'team-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 id="team-name"></h2>
            <p id="team-description"></p>
            
            <div class="team-stats">
                <div class="stat">
                    <span class="number" id="team-wins"></span>
                    <span class="label">Wins</span>
                </div>
                <div class="stat">
                    <span class="number" id="team-losses"></span>
                    <span class="label">Losses</span>
                </div>
                <div class="stat">
                    <span class="number" id="team-championships"></span>
                    <span class="label">Championships</span>
                </div>
            </div>
            
            <div class="team-details">
                <div class="detail-card">
                    <h3>Conference</h3>
                    <div class="value" id="team-conference"></div>
                </div>
                <div class="detail-card">
                    <h3>Founded</h3>
                    <div class="value" id="team-founded"></div>
                </div>
                <div class="detail-card">
                    <h3>Arena</h3>
                    <div class="value" id="team-arena"></div>
                </div>
                <div class="detail-card">
                    <h3>Head Coach</h3>
                    <div class="value" id="team-coach"></div>
                </div>
            </div>
            
            <div class="team-roster">
                <h3>Team Roster</h3>
                <div class="roster-list" id="team-roster"></div>
            </div>
            
            <button class="close-modal">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Get all team cards
    const teamCards = document.querySelectorAll('.team-card');
    
    // Add click event to team cards
    teamCards.forEach(card => {
        card.addEventListener('click', function() {
            const team = card.getAttribute('data-team');
            showTeamModal(teamsData[team]);
        });
        
        // Add ripple effect on click
        card.addEventListener('mousedown', createRipple);
    });
    
    // Close modal when close button is clicked
    document.querySelector('.close-modal').addEventListener('click', function() {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.style.overflow = 'auto';
        }, 300);
    });
    
    // Close modal when clicking outside the content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                document.body.style.overflow = 'auto';
            }, 300);
        }
    });
    
    // Function to show team modal with data
    function showTeamModal(team) {
        // Set team data in modal
        document.getElementById('team-name').textContent = team.name;
        document.getElementById('team-description').textContent = team.description;
        document.getElementById('team-wins').textContent = team.wins;
        document.getElementById('team-losses').textContent = team.losses;
        document.getElementById('team-championships').textContent = team.championships;
        document.getElementById('team-conference').textContent = team.conference;
        document.getElementById('team-founded').textContent = team.founded;
        document.getElementById('team-arena').textContent = team.arena;
        document.getElementById('team-coach').textContent = team.headCoach;
        
        // Generate roster
        const rosterContainer = document.getElementById('team-roster');
        rosterContainer.innerHTML = '';
        
        team.roster.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="player-number">#${player.number}</span>
                <span class="player-position">${player.position}</span>
            `;
            rosterContainer.appendChild(playerCard);
        });
        
        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    // Create ripple effect function
    function createRipple(event) {
        const button = event.currentTarget;
        
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add('ripple');
        
        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }
        
        button.appendChild(circle);
    }
    
    // Gallery image modal
    const galleryItems = document.querySelectorAll('.gallery-item');
    const imageModal = document.createElement('div');
    imageModal.className = 'image-modal';
    imageModal.innerHTML = `
        <div class="image-modal-content">
            <span class="close-image-modal">&times;</span>
            <img id="modal-image" src="" alt="Gallery Image">
            <div class="image-caption" id="image-caption"></div>
        </div>
    `;
    document.body.appendChild(imageModal);
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const imgSrc = this.querySelector('img').src;
            const caption = this.querySelector('img').alt;
            document.getElementById('modal-image').src = imgSrc;
            document.getElementById('image-caption').textContent = caption;
            imageModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    });
    
    document.querySelector('.close-image-modal').addEventListener('click', function() {
        imageModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    });
    
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            imageModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Stats Card Interactive Elements
    const statsCards = document.querySelectorAll('.stats-card');
    statsCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });
    
    // Show animation for sections when scrolling
    const animateOnScroll = function() {
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionPosition = section.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (sectionPosition < screenPosition) {
                section.classList.add('section-animate');
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    // Run once to check initial elements in view
    animateOnScroll();
});

// Initialize section interactivity
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sections
    initializeSections();
    
    // Initialize team cards
    initializeTeamCards();
    
    // Initialize stats cards
    initializeStatsCards();
    
    // Initialize gallery
    initializeGallery();
    
    // Initialize news cards
    initializeNewsCards();
});

function initializeSections() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');

    // Add click handlers to sections
    sections.forEach(section => {
        // Add hover effect class
        section.classList.add('interactive-section');
        
        // Add click handler
        section.addEventListener('click', (e) => {
            if (e.target === section || e.target.closest('.container')) {
                const sectionId = section.getAttribute('id');
                highlightSection(sectionId);
            }
        });
        
        // Add intersection observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('section-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(section);
    });

    // Smooth scroll navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.getElementById(targetId.slice(1));
            
            if (targetSection) {
                // Smooth scroll
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Update active states
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close mobile menu if open
                mobileMenuBtn.classList.remove('active');
                navLinksContainer.classList.remove('show');
                
                // Highlight section
                highlightSection(targetId);
            }
        });
    });

    // Mobile menu toggle
    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navLinksContainer.classList.toggle('show');
    });

    // Handle scroll for active section
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const sectionId = section.getAttribute('id');
                updateActiveLink(sectionId);
            }
        });
    });
}

function initializeTeamCards() {
    const teamCards = document.querySelectorAll('.team-card');
    
    teamCards.forEach(card => {
        card.addEventListener('click', () => {
            const team = card.getAttribute('data-team');
            showTeamDetails(team);
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
    });
}

function initializeStatsCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
    });
}

function initializeGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const imgSrc = item.dataset.src;
            showImageModal(imgSrc);
        });
        
        // Add hover effect
        item.addEventListener('mouseenter', () => {
            item.classList.add('item-hover');
        });
        
        item.addEventListener('mouseleave', () => {
            item.classList.remove('item-hover');
        });
    });
}

function initializeNewsCards() {
    const newsCards = document.querySelectorAll('.news-card');
    
    newsCards.forEach(card => {
        card.addEventListener('click', () => {
            const link = card.querySelector('.read-more')?.getAttribute('href');
            if (link && link !== '#') {
                window.location.href = link;
            }
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
    });
}

function highlightSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('section-highlight');
        setTimeout(() => {
            section.classList.remove('section-highlight');
        }, 1000);
    }
}

function updateActiveLink(sectionId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(sectionId)) {
            link.classList.add('active');
        }
    });
}

function showImageModal(imgSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <img src="${imgSrc}" alt="Gallery Image">
            <button class="close-modal">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });
}

// Team Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("Fixing team card clicks");
    // Clear any previous event listeners
    const teamCards = document.querySelectorAll('.team-card');
    const teamModal = document.querySelector('.team-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    
    if (!teamCards.length) {
        console.error("No team cards found");
        return;
    }
    
    console.log(`Found ${teamCards.length} team cards`);
    
    // Add click event to each team card with improved handling
    teamCards.forEach(card => {
        // Remove previous event listeners if any
        const clone = card.cloneNode(true);
        card.parentNode.replaceChild(clone, card);
        
        // Add the event listener to the new element
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Team card clicked:", this);
            
            // Get team identifier from card
            const teamId = this.getAttribute('data-team');
            console.log("Team ID:", teamId);
            
            if (teamId) {
                // Show team details in modal
                showTeamDetails(teamId);
                return false;
            }
        });
    });
    
    // Function to show team details
    function showTeamDetails(teamId) {
        console.log("Showing team details for:", teamId);
        
        // Get team data
        const team = {
            warriors: {
                name: 'Golden State Warriors',
                description: 'The Golden State Warriors are an American professional basketball team based in San Francisco.',
                founded: 1946,
                championships: 7
            },
            lakers: {
                name: 'Los Angeles Lakers',
                description: 'The Los Angeles Lakers are an American professional basketball team based in Los Angeles.',
                founded: 1947,
                championships: 17
            },
            celtics: {
                name: 'Boston Celtics',
                description: 'The Boston Celtics are an American professional basketball team based in Boston.',
                founded: 1946,
                championships: 18
            },
            nets: {
                name: 'Brooklyn Nets',
                description: 'The Brooklyn Nets are an American professional basketball team based in the New York City borough of Brooklyn.',
                founded: 1967,
                championships: 0
            },
            heat: {
                name: 'Miami Heat',
                description: 'The Miami Heat are an American professional basketball team based in Miami.',
                founded: 1988,
                championships: 3
            },
            bucks: {
                name: 'Milwaukee Bucks',
                description: 'The Milwaukee Bucks are an American professional basketball team based in Milwaukee.',
                founded: 1968,
                championships: 2
            }
        }[teamId];
        
        if (!team) {
            console.error("Team not found:", teamId);
            return;
        }
        
        // Set modal content
        document.getElementById('team-name').textContent = team.name;
        document.getElementById('team-description').textContent = team.description;
        
        // Show modal
        const modal = document.querySelector('.team-modal');
        modal.style.display = 'flex';
    }
    
    // Close modal button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            teamModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    if (teamModal) {
        teamModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    // Fix navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        // Remove previous event listeners
        const clone = link.cloneNode(true);
        link.parentNode.replaceChild(clone, link);
        
        // Add new event listener
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                console.log("Scrolling to:", targetId);
                
                // Scroll to section
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update active class
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
            
            return false;
        });
    });

    // Fix Book Tickets buttons
    const bookButtons = document.querySelectorAll('.book-ticket');
    bookButtons.forEach(btn => {
        // Remove previous listeners
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
        
        // Add new listener
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const gameId = this.getAttribute('data-game');
            alert(`Booking tickets for game: ${gameId}`);
            return false;
        });
    });
});

// Handle scroll for active section
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            const sectionId = section.getAttribute('id');
            updateActiveLink(sectionId);
        }
    });
};

// Added semicolon at the end of the script
