import React from 'react'

export default function About() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <span className="eyebrow">Our Heritage</span>
        <h2>About GOSH CAFE</h2>
        <p>
          A modern neighbourhood café built for those who appreciate exceptional coffee, locally sourced ingredients, and thoughtful hospitality in the heart of Lilongwe.
        </p>
      </section>

      <div className="about-content">
        {/* Story Section */}
        <section className="about-section">
          <div className="about-grid">
            <div>
              <span className="eyebrow">Our Story</span>
              <h3>Where passion meets purpose</h3>
              <p>
                Started as a small coffee room with a clear vision — to deliver beautifully brewed coffee and freshly baked treats in an inviting atmosphere. We combine modern café culture with refined hospitality, ensuring every guest feels genuinely welcomed.
              </p>
              <p>
                Today, GOSH CAFE stands as a community gathering place where coffee enthusiasts, professionals, and friends converge for meaningful moments and exceptional experiences in Malawi.
              </p>
            </div>
            <div className="about-visual">
              ☕
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="about-features">
          <span className="eyebrow">Why Choose Us</span>
          <h3>What makes us different</h3>
          
          <div className="about-features-grid">
            {[
              {
                icon: '🌱',
                title: 'Premium Ingredients',
                desc: 'We work with trusted local suppliers for coffee, dairy, grains, and seasonal produce. Quality starts with sourcing.'
              },
              {
                icon: '✨',
                title: 'Crafted Flavors',
                desc: 'Every menu item is carefully balanced to deliver rich taste and simple elegance. Attention to detail in every bite.'
              },
              {
                icon: '❤️',
                title: 'Genuine Experience',
                desc: 'Our team is trained to make you feel at home. We prioritize warm service and creating memorable moments.'
              }
            ].map((item, idx) => (
              <div key={idx} className="about-feature-card">
                <div className="about-feature-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="about-values">
          <span className="eyebrow">Our Principles</span>
          <h3>Values we stand by</h3>
          
          <div className="about-values-grid">
            {[
              { emoji: '⭐', title: 'Quality', desc: 'Freshly roasted beans, house-made pastries, and thoughtful recipes served every single day.' },
              { emoji: '🤝', title: 'Hospitality', desc: 'Warm, genuine service in a calm, welcoming space for guests, friends, and families alike.' },
              { emoji: '🌍', title: 'Community', desc: 'Supporting local producers and building a vibrant space where people naturally connect.' },
              { emoji: '🌿', title: 'Sustainability', desc: 'Eco-conscious practices and partnerships to protect the environment for future generations.' }
            ].map((val, idx) => (
              <div key={idx} className="about-value-card">
                <div className="about-value-emoji">{val.emoji}</div>
                <h4>{val.title}</h4>
                <p>{val.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="about-contact">
          <h3>Ready to join us?</h3>
          <p>
            Visit our café to experience the GOSH CAFE difference. We're open daily and always happy to welcome new friends.
            Drop by for a handcrafted coffee, a seasonal brunch, or an evening treat. We welcome walk-ins and reservations, and our team is happy to help you plan the perfect visit.
          </p>
          <div className="about-contact-info">
            <div><strong>Address:</strong> 23 Market Street, Lilongwe, Malawi</div>
            <div><strong>Phone:</strong> <a href="tel:+265999000000">+265 999 000 000</a></div>
            <div><strong>Email:</strong> <a href="mailto:hello@goshcafe.mw">hello@goshcafe.mw</a></div>
          </div>
          <div className="about-actions">
            <a href="/menu" className="about-btn">
              Explore Our Menu
            </a>
            <a href="/reserve" className="about-btn about-btn-secondary">
              Make a Reservation
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}