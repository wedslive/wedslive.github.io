/*
 * weds.live invitation engine · domain/catalog.js
 *
 * Event types and wedding traditions. Configs refer to these by key
 * ("type": "haldi", "tradition": "muslim") and can override any label.
 * Templates draw their own icon for each `icon` key and fall back to
 * `default` for anything they don't illustrate.
 */
(function (root) {
    'use strict';

    const WL = root.WL;

    // hours = default length, used for calendar exports when no end time is given
    const EVENT_TYPES = {
        engagement:  { icon: 'rings',      hours: 3, name: { en: 'Engagement', mr: 'साखरपुडा', hi: 'सगाई' } },
        roka:        { icon: 'rings',      hours: 3, name: { en: 'Roka', mr: 'रोका', hi: 'रोका' } },
        tilak:       { icon: 'kalash',     hours: 3, name: { en: 'Tilak', mr: 'टिळा', hi: 'तिलक' } },
        haldi:       { icon: 'haldi',      hours: 3, name: { en: 'Haldi', mr: 'हळद', hi: 'हल्दी' } },
        mehendi:     { icon: 'mehendi',    hours: 4, name: { en: 'Mehendi', mr: 'मेहंदी', hi: 'मेहंदी' } },
        sangeet:     { icon: 'sangeet',    hours: 4, name: { en: 'Sangeet', mr: 'संगीत संध्या', hi: 'संगीत संध्या' } },
        simantpujan: { icon: 'kalash',     hours: 2, name: { en: 'Simant Pujan', mr: 'सीमांत पूजन', hi: 'सीमांत पूजन' } },
        baraat:      { icon: 'baraat',     hours: 2, name: { en: 'Baraat', mr: 'वरात', hi: 'बारात' } },
        wedding:     { icon: 'mandap',     hours: 3, main: true, name: { en: 'Wedding Ceremony', mr: 'शुभविवाह', hi: 'शुभ विवाह' } },
        reception:   { icon: 'chandelier', hours: 4, name: { en: 'Reception', mr: 'स्वागत समारंभ', hi: 'प्रीतिभोज' } },
        nikah:       { icon: 'crescent',   hours: 3, main: true, name: { en: 'Nikah', mr: 'निकाह', hi: 'निकाह' } },
        walima:      { icon: 'feast',      hours: 3, name: { en: 'Walima', mr: 'वलीमा', hi: 'वलीमा' } },
        anandkaraj:  { icon: 'dome',       hours: 3, main: true, name: { en: 'Anand Karaj', mr: 'आनंद कारज', hi: 'आनंद कारज' } },
        church:      { icon: 'chapel',     hours: 2, main: true, name: { en: 'Holy Matrimony', mr: 'विवाह संस्कार', hi: 'विवाह संस्कार' } },
        civil:       { icon: 'rings',      hours: 2, main: true, name: { en: 'Wedding', mr: 'विवाह', hi: 'विवाह' } },
        cocktail:    { icon: 'sparkle',    hours: 4, name: { en: 'Cocktail Evening', mr: 'कॉकटेल संध्या', hi: 'कॉकटेल संध्या' } },
        welcome:     { icon: 'feast',      hours: 3, name: { en: 'Welcome Dinner', mr: 'स्वागत भोजन', hi: 'स्वागत भोज' } },
        other:       { icon: 'default',    hours: 3, name: { en: 'Celebration', mr: 'कार्यक्रम', hi: 'कार्यक्रम' } },
    };

    // honorifics: the short prefixes printed before names on Marathi and
    // Hindi cards (चि. = चिरंजीव, चि. सौ. कां. = चिरंजीव सौभाग्यकांक्षिणी,
    // आयु. = आयुष्मती). English cards don't use them.
    const DEVA_HONORIFICS = {
        mr: { groom: 'चि.', bride: 'चि. सौ. कां.' },
        hi: { groom: 'चि.', bride: 'आयु.' },
    };

    const TRADITIONS = {
        hindu: {
            mainType: 'wedding',
            honorifics: DEVA_HONORIFICS,
            invocation: { en: '॥ Shri Ganeshaya Namah ॥', mr: '॥ श्री गणेशाय नमः ॥', hi: '॥ श्री गणेशाय नमः ॥' },
        },
        jain: {
            mainType: 'wedding',
            honorifics: DEVA_HONORIFICS,
            invocation: { en: '॥ Shri Mahaviraya Namah ॥', mr: '॥ श्री महावीराय नमः ॥', hi: '॥ श्री महावीराय नमः ॥' },
        },
        buddhist: {
            mainType: 'wedding',
            honorifics: DEVA_HONORIFICS,
            invocation: { en: 'Namo Buddhaya', mr: '॥ नमो बुद्धाय ॥', hi: '॥ नमो बुद्धाय ॥' },
        },
        sikh: {
            mainType: 'anandkaraj',
            invocation: { '*': 'ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ', '@lang': 'pa' },
        },
        muslim: {
            mainType: 'nikah',
            invocation: { '*': 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '@lang': 'ar' },
        },
        christian: {
            mainType: 'church',
            invocation: {
                en: '“What God has joined together, let no one separate.” Mark 10:9',
                mr: '“देवाने जे जोडले आहे, ते माणसाने तोडू नये.” मार्क १०:९',
                hi: '“जिसे परमेश्वर ने जोड़ा है, उसे मनुष्य अलग न करे।” मरकुस 10:9',
            },
        },
        parsi: { mainType: 'wedding', invocation: null },
        interfaith: { mainType: 'wedding', invocation: null },
        civil: { mainType: 'civil', invocation: null },
        none: { mainType: 'wedding', invocation: null },
    };

    // Scripts that need an extra web font when they appear in content.
    const SCRIPTS = {
        deva: { test: /[\u0900-\u097F]/, lang: 'hi' },
        arab: { test: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/, lang: 'ar' },
        guru: { test: /[\u0A00-\u0A7F]/, lang: 'pa' },
    };

    WL.catalog = {
        EVENT_TYPES,
        TRADITIONS,
        SCRIPTS,
        eventType: (key) => EVENT_TYPES[key] || EVENT_TYPES.other,
        tradition: (key) => TRADITIONS[key] || TRADITIONS.none,
    };
})(window);
