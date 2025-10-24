// Parallax scrolling effect for features section
document.addEventListener('DOMContentLoaded', function () {
    const parallaxSections = document.querySelectorAll('.parallax-section');
    const floatingNavbar = document.querySelector('.navbar-floating:not(.solid)');

    function updateParallax() {
        if (floatingNavbar) {
            let backPercentage = Math.min(100, $(window).scrollTop() / 50);
            floatingNavbar.style.background = `rgba(255, 255, 255, ${backPercentage / 100})`;
        }
    }

    window.addEventListener('scroll', updateParallax);
    updateParallax(); // Initial call
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
        }
    });
});

// Enhanced hover effects for feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.point, .feature-card, .offer-card').forEach(el => {
    observer.observe(el);
});

// Add CSS for animate-in class
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Enhanced Hero Section: Particle Background
function createParticles() {
    const heroParticles = document.getElementById('heroParticles');
    if (!heroParticles) return;

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-particle';

        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Random animation delay
        particle.style.animationDelay = Math.random() * 8 + 's';

        heroParticles.appendChild(particle);
    }
}

// Typing effect for headings
function initTypingEffect() {
    const typingElements = document.querySelectorAll('.typing-effect');

    typingElements.forEach(element => {
        const text = element.textContent;
        const dataText = element.getAttribute('data-text') || text;
        element.textContent = '';

        let i = 0;
        const timer = setInterval(() => {
            if (i < dataText.length) {
                element.textContent += dataText.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, 50);
    });
}

// Initialize enhanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    createParticles();
    initTypingEffect();
});
