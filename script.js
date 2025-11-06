// Smooth scrolling for internal links only
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

// Navbar background on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    const goTop = document.getElementById('goTop');
    
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(74, 144, 226, 0.98)';
    } else {
        navbar.style.background = 'rgba(74, 144, 226, 0.95)';
    }
    
    // Show/hide go to top button
    if (window.scrollY > 500) {
        goTop.classList.add('visible');
    } else {
        goTop.classList.remove('visible');
    }
});

// Mobile menu toggle
document.querySelector('.hamburger').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('.nav-menu').classList.toggle('active');
});

// Form submission with validation
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        alert('Please fill in all fields.');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Simulate form submission
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        alert(`Thank you, ${formData.name}! Your message has been sent successfully. I will get back to you soon.`);
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Animate skill bars on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skillLevel = entry.target;
            const width = skillLevel.style.width;
            skillLevel.style.width = '0';
            setTimeout(() => {
                skillLevel.style.width = width;
            }, 300);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.skill-level').forEach(skill => {
    observer.observe(skill);
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.hamburger').classList.remove('active');
        document.querySelector('.nav-menu').classList.remove('active');
    });
});

// Go to top functionality
document.getElementById('goTop').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Hero Section Slideshow
let heroCurrentSlide = 0;
const heroSlides = document.querySelectorAll('.hero-slideshow .slide');
const heroSlideCount = heroSlides.length;

function nextHeroSlide() {
    heroSlides[heroCurrentSlide].classList.remove('active');
    heroCurrentSlide = (heroCurrentSlide + 1) % heroSlideCount;
    heroSlides[heroCurrentSlide].classList.add('active');
}

// About Section Slideshow
let aboutCurrentSlide = 0;
const aboutSlides = document.querySelectorAll('.about-slideshow .slide');
const aboutSlideCount = aboutSlides.length;

function nextAboutSlide() {
    aboutSlides[aboutCurrentSlide].classList.remove('active');
    aboutCurrentSlide = (aboutCurrentSlide + 1) % aboutSlideCount;
    aboutSlides[aboutCurrentSlide].classList.add('active');
}

// Start slideshows
setInterval(nextHeroSlide, 5000);
setInterval(nextAboutSlide, 5000);

// Initialize first slides
heroSlides[0].classList.add('active');
aboutSlides[0].classList.add('active');