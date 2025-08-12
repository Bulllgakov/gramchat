// =====================================================
// GramChat Landing Page JavaScript
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Mobile Menu Toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-nav a, .mobile-menu-actions a');
  
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
  
  // Close mobile menu when clicking on links
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });
  
  // Smooth Scroll for Navigation Links
  const navLinks = document.querySelectorAll('a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href !== '#' && href !== '#demo') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offsetTop = target.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // Navbar Background on Scroll
  const navbar = document.querySelector('.navbar');
  
  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(255, 255, 255, 0.98)';
      navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    } else {
      navbar.style.background = 'rgba(255, 255, 255, 0.95)';
      navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
    }
  }
  
  window.addEventListener('scroll', handleNavbarScroll);
  
  // Scroll Animation Observer
  const animateElements = document.querySelectorAll('.problem-card, .feature-card, .step, .roadmap-item, .pricing-card, .testimonial-card, .faq-item');
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(30px)';
          entry.target.style.transition = 'all 0.6s ease';
          
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 50);
        }, index * 100);
        
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  animateElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    observer.observe(element);
  });
  
  // Newsletter Form
  const newsletterForm = document.querySelector('.newsletter-form');
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]').value;
      
      // Here you would normally send the email to your backend
      console.log('Newsletter subscription:', email);
      
      // Show success message
      const button = newsletterForm.querySelector('button');
      const originalText = button.textContent;
      button.textContent = 'Подписка оформлена!';
      button.style.background = '#28A745';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
        newsletterForm.reset();
      }, 3000);
    });
  }
  
  // Demo Video Modal (placeholder for future implementation)
  const demoLink = document.querySelector('a[href="#demo"]');
  
  if (demoLink) {
    demoLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Here you would open a modal with demo video
      alert('Демо видео будет доступно в ближайшее время!');
    });
  }
  
  // Add hover effect to pricing cards
  const pricingCards = document.querySelectorAll('.pricing-card');
  
  pricingCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('featured')) {
        card.style.transform = 'translateY(-10px)';
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('featured')) {
        card.style.transform = '';
      }
    });
  });
  
  // Parallax Effect for Hero Section
  const heroImage = document.querySelector('.hero-image');
  const floatingCards = document.querySelectorAll('.floating-card');
  
  if (heroImage) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      
      if (scrolled < 800) {
        heroImage.style.transform = `translateY(${rate * 0.3}px)`;
        
        floatingCards.forEach((card, index) => {
          const cardRate = rate * (0.2 + index * 0.1);
          card.style.transform = `translateY(${cardRate}px)`;
        });
      }
    });
  }
  
  // Counter Animation for Stats
  function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
      start += increment;
      if (start < target) {
        element.textContent = Math.ceil(start);
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target;
      }
    }
    
    updateCounter();
  }
  
  // Trigger counter animation when stats section is visible
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const amounts = document.querySelectorAll('.amount');
        amounts.forEach(amount => {
          const value = parseInt(amount.textContent);
          if (value > 0) {
            amount.textContent = '0';
            animateCounter(amount, value);
          }
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  const pricingSection = document.querySelector('.pricing');
  if (pricingSection) {
    statsObserver.observe(pricingSection);
  }
  
  // Add active state to navigation based on scroll position
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');
  
  function highlightNavigation() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100;
      const sectionId = section.getAttribute('id');
      
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
            item.style.color = '#0088CC';
          } else {
            item.style.color = '';
          }
        });
      }
    });
  }
  
  window.addEventListener('scroll', highlightNavigation);
  
  // Typing Effect for Hero Title (optional enhancement)
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle && window.innerWidth > 768) {
    const originalHTML = heroTitle.innerHTML;
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    heroTitle.style.minHeight = '120px';
    
    let index = 0;
    function typeWriter() {
      if (index < text.length) {
        if (text.substring(index, index + 28) === 'полноценный отдел продаж') {
          heroTitle.innerHTML = text.substring(0, index) + '<span class="gradient-text">' + text.substring(index, index + 24) + '</span>';
          index += 24;
        } else {
          heroTitle.textContent += text.charAt(index);
          index++;
        }
        setTimeout(typeWriter, 30);
      } else {
        heroTitle.innerHTML = originalHTML;
      }
    }
    
    setTimeout(typeWriter, 500);
  }
  
  // FAQ Accordion (optional enhancement)
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    // Initially hide answers
    answer.style.maxHeight = '200px';
    answer.style.overflow = 'hidden';
    answer.style.transition = 'max-height 0.3s ease';
    
    question.style.cursor = 'pointer';
    
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      
      // Close all other FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          otherAnswer.style.maxHeight = '200px';
        }
      });
      
      // Toggle current item
      if (isOpen) {
        item.classList.remove('open');
        answer.style.maxHeight = '200px';
      } else {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
  
  // Lazy Load Images
  const images = document.querySelectorAll('img[data-src]');
  
  if (images.length > 0) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
  
  // Form Validation Feedback
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        if (!input.value) {
          input.style.borderColor = '#DC3545';
        } else {
          input.style.borderColor = '#28A745';
        }
      });
      
      input.addEventListener('focus', () => {
        input.style.borderColor = '#0088CC';
      });
    });
  });
  
  // Performance optimization - Throttle scroll events
  let ticking = false;
  
  function throttledScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleNavbarScroll();
        highlightNavigation();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', throttledScroll, { passive: true });
  
  // Initialize
  console.log('GramChat Landing Page Initialized');
});

// Utility function for smooth scroll
function smoothScrollTo(target, duration = 1000) {
  const targetPosition = target.offsetTop - 80;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;
  
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }
  
  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }
  
  requestAnimationFrame(animation);
}