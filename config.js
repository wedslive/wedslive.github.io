// Configuration file for weds.live
const CONFIG = {
    // Site statistics
    stats: {
        invitationsSent: 10000,
        templates: 10,
        happyCouples: 10000,
        satisfaction: 98,
        averageRating: 4.9
    },
    
    // Countdown settings
    countdown: {
        daysAhead: 47 // Number of days ahead for the demo countdown
    },
    
    // Template categories
    templateCategories: {
        all: 'All',
        wedding: 'Wedding',
        engagement: 'Engagement'
    },
    
    // Social media links (to be updated)
    social: {
        instagram: '#',
        pinterest: '#',
        whatsapp: 'https://wa.me/'
    },
    
    // SEO settings
    seo: {
        siteName: 'weds.live',
        siteUrl: 'https://weds.live/',
        defaultTitle: 'weds.live — Beautiful Digital Wedding Invitations',
        defaultDescription: 'Create stunning digital wedding invitations in minutes. Choose from 50+ beautiful templates, share instantly via WhatsApp. Trusted by 10,000+ Indian couples.'
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
