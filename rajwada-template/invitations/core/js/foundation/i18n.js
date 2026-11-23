/*
 * weds.live invitation engine · foundation/i18n.js
 *
 * UI strings (English, Marathi, Hindi), multilingual content resolution and
 * Indian-style date / time / number formatting.
 *
 * Content fields in a wedding config may be a plain string or an object
 * keyed by language: { "en": "…", "mr": "…", "hi": "…" }. Use "*" for text
 * that is identical in every language (e.g. an Arabic or Gurmukhi line).
 *
 * Strings are layered: core defaults < template overrides < config "labels".
 */
(function (root) {
    'use strict';

    const WL = root.WL;

    const LANGS = {
        en: { label: 'English', locale: 'en-IN', script: 'latn', dir: 'ltr', nativeDigits: 'latn' },
        mr: { label: 'मराठी', locale: 'mr-IN', script: 'deva', dir: 'ltr', nativeDigits: 'deva' },
        hi: { label: 'हिंदी', locale: 'hi-IN', script: 'deva', dir: 'ltr', nativeDigits: 'deva' },
    };

    // Default digits follow CLDR: Marathi prints Devanagari numerals, Hindi
    // prints Latin ones. config.lang.numerals can force 'native' or 'latin'.
    const DEFAULT_DIGITS = { en: 'latn', mr: 'deva', hi: 'latn' };

    const STRINGS = {
        en: {
            'loading': 'Preparing your invitation',
            'skip': 'Skip to the invitation',
            'notFound.title': 'This invitation link looks incomplete',
            'notFound.body': 'It may have been cut off when it was shared. Please ask the family to send the full link again.',
            'notFound.cta': 'Create your own invitation',

            'envelope.for': 'An invitation for',
            'envelope.invited': 'You are cordially invited',
            'envelope.open': 'Open the invitation',
            'envelope.hint': 'Tap the seal to open',

            'hero.weddingOf': 'The wedding of',
            'hero.engagementOf': 'The engagement of',
            'hero.dear': 'Dear',
            'hero.scroll': 'Scroll to begin',
            'joiner': '&',
            'and': 'and',

            'announcement.kicker': 'Together with their families',
            'announcement.title': 'You are invited',

            'couple.kicker': 'Two hearts, one journey',
            'couple.title': 'The Bride & Groom',
            'couple.groom': 'The Groom',
            'couple.bride': 'The Bride',
            'couple.partner': 'Partner',
            'couple.sonOf': 'Son of {parents}',
            'couple.daughterOf': 'Daughter of {parents}',
            'couple.childOf': 'Child of {parents}',

            'families.kicker': 'With the blessings of our elders',
            'families.title': 'Our Families',
            'families.groomSide': 'The Groom’s Family',
            'families.brideSide': 'The Bride’s Family',
            'families.blessings': 'With the blessings of',
            'families.hosts': 'Invited by',
            'families.welcome': 'Awaiting your presence',

            'countdown.kicker': 'The auspicious day',
            'countdown.title': 'Counting the moments',
            'countdown.days': 'Days',
            'countdown.hours': 'Hours',
            'countdown.minutes': 'Minutes',
            'countdown.seconds': 'Seconds',
            'countdown.left': '{days} days, {hours} hours to go',
            'countdown.today': 'The celebrations begin today!',
            'countdown.done': 'Happily married. Thank you for your blessings.',
            'countdown.yourTime': 'That is {time} on {date} where you are ({zone}).',

            'events.kicker': 'The celebrations',
            'events.title': 'Wedding Festivities',
            'events.onwards': '{time} onwards',
            'events.range': '{start} – {end}',
            'events.muhurat': 'Auspicious time',
            'events.dressCode': 'Dress code',
            'events.venue': 'Venue',
            'events.directions': 'Directions',
            'events.addToCalendar': 'Add to calendar',
            'events.calendarMenu': 'Choose a calendar',
            'events.google': 'Google Calendar',
            'events.ics': 'Apple / Outlook (.ics)',
            'events.allToCalendar': 'Add all celebrations to calendar',

            'venue.kicker': 'Where we celebrate',
            'venue.title': 'The Venue',
            'venue.showMap': 'Show map',
            'venue.directions': 'Get directions',
            'venue.copy': 'Copy address',
            'venue.copied': 'Address copied',
            'venue.mapTitle': 'Map showing {venue}',
            'venue.hosting': 'Celebrations here',

            'guide.kicker': 'Good to know',
            'guide.title': 'Guest Information',
            'guide.dressCode': 'Dress code',
            'guide.contacts': 'For any help, please call',
            'guide.call': 'Call {name}',
            'guide.whatsapp': 'WhatsApp {name}',

            'gallery.kicker': 'Moments',
            'gallery.title': 'Our Story in Frames',
            'gallery.open': 'Open photo {n} of {total}',
            'gallery.dialog': 'Photo viewer',
            'gallery.close': 'Close',
            'gallery.next': 'Next photo',
            'gallery.prev': 'Previous photo',
            'gallery.counter': '{n} / {total}',
            'gallery.swipe': 'Swipe to see more',

            'rsvp.kicker': 'Kindly respond',
            'rsvp.title': 'Will you join us?',
            'rsvp.deadline': 'Kindly respond by {date}',
            'rsvp.name': 'Your name',
            'rsvp.namePlaceholder': 'Full name',
            'rsvp.attending': 'Will you attend?',
            'rsvp.yes': 'Joyfully accept',
            'rsvp.no': 'Regretfully decline',
            'rsvp.guests': 'Number of guests',
            'rsvp.guestsHint': 'Including you, up to {max}',
            'rsvp.fewer': 'One guest fewer',
            'rsvp.more': 'One guest more',
            'rsvp.events': 'Which celebrations will you attend?',
            'rsvp.diet': 'Meal preference',
            'rsvp.diet.veg': 'Vegetarian',
            'rsvp.diet.jain': 'Jain',
            'rsvp.diet.vegan': 'Vegan',
            'rsvp.diet.nonveg': 'Non-vegetarian',
            'rsvp.phone': 'Phone (optional)',
            'rsvp.message': 'Blessings for the couple (optional)',
            'rsvp.submit': 'Send my response',
            'rsvp.submitWhatsapp': 'Send on WhatsApp',
            'rsvp.sending': 'Sending…',
            'rsvp.thanksYes': 'Thank you, {name}! We can’t wait to celebrate with you.',
            'rsvp.thanksNo': 'Thank you, {name}. You will be missed, and your blessings mean the world to us.',
            'rsvp.whatsappOpened': 'WhatsApp should now be open with your reply. Please press send there.',
            'rsvp.change': 'Change my response',
            'rsvp.closed': 'Responses are now closed. Please contact the family directly.',
            'rsvp.error.summary': 'Please check the highlighted details.',
            'rsvp.error.name': 'Please tell us your name.',
            'rsvp.error.attending': 'Please choose one option.',
            'rsvp.error.guests': 'Please choose between 1 and {max} guests.',
            'rsvp.error.events': 'Please choose at least one celebration.',
            'rsvp.error.phone': 'Please enter a valid phone number, or leave it empty.',
            'rsvp.error.network': 'We couldn’t send your response. Please check your connection and try again.',
            'rsvp.wa.title': 'RSVP for {couple}',
            'rsvp.wa.name': 'Name',
            'rsvp.wa.attending': 'Attending',
            'rsvp.wa.guests': 'Guests',
            'rsvp.wa.events': 'Celebrations',
            'rsvp.wa.diet': 'Meal',
            'rsvp.wa.message': 'Message',
            'rsvp.wa.yes': 'Yes',
            'rsvp.wa.no': 'No',

            'thankyou.kicker': 'With love & gratitude',
            'thankyou.title': 'Thank You',
            'thankyou.message': 'Your love and blessings are the greatest gift. We look forward to celebrating with you.',
            'footer.made': 'Made with love on',
            'footer.create': 'Create your own invitation',

            'music.play': 'Play music',
            'music.pause': 'Pause music',
            'music.hint': 'Tap for music',
            'lang.label': 'Language',
        },

        mr: {
            'loading': 'आपले निमंत्रण तयार होत आहे',
            'skip': 'थेट निमंत्रणाकडे जा',
            'notFound.title': 'ही निमंत्रण लिंक अपूर्ण दिसते',
            'notFound.body': 'शेअर करताना लिंक कापली गेली असावी. कृपया कुटुंबीयांना पूर्ण लिंक पुन्हा पाठवण्यास सांगा.',
            'notFound.cta': 'आपले निमंत्रण तयार करा',

            'envelope.for': 'सस्नेह निमंत्रण',
            'envelope.invited': 'आपणास सस्नेह निमंत्रण',
            'envelope.open': 'निमंत्रण उघडा',
            'envelope.hint': 'उघडण्यासाठी मुद्रेवर स्पर्श करा',

            'hero.weddingOf': 'शुभविवाह',
            'hero.engagementOf': 'साखरपुडा',
            'hero.dear': 'प्रिय',
            'hero.scroll': 'पुढे पाहा',
            'joiner': 'आणि',
            'and': 'व',

            'announcement.kicker': 'सप्रेम नमस्कार',
            'announcement.title': 'आग्रहाचे निमंत्रण',

            'couple.kicker': 'दोन मने, एक प्रवास',
            'couple.title': 'वधू आणि वर',
            'couple.groom': 'वर',
            'couple.bride': 'वधू',
            'couple.partner': 'जोडीदार',
            'couple.sonOf': '{parents} यांचे सुपुत्र',
            'couple.daughterOf': '{parents} यांची सुकन्या',
            'couple.childOf': '{parents} यांचे अपत्य',

            'families.kicker': 'वडीलधाऱ्यांच्या आशीर्वादाने',
            'families.title': 'आमचे कुटुंबीय',
            'families.groomSide': 'वरपक्ष',
            'families.brideSide': 'वधूपक्ष',
            'families.blessings': 'कृपाशीर्वाद',
            'families.hosts': 'निमंत्रक',
            'families.welcome': 'स्वागतोत्सुक',

            'countdown.kicker': 'मंगल दिवस',
            'countdown.title': 'आतुरता शुभदिनाची',
            'countdown.days': 'दिवस',
            'countdown.hours': 'तास',
            'countdown.minutes': 'मिनिटे',
            'countdown.seconds': 'सेकंद',
            'countdown.left': 'आणखी {days} दिवस, {hours} तास',
            'countdown.today': 'आज शुभदिन!',
            'countdown.done': 'शुभमंगल संपन्न. आपल्या आशीर्वादांबद्दल मनःपूर्वक धन्यवाद.',
            'countdown.yourTime': 'आपल्या वेळेनुसार हे {date} रोजी {time} ({zone}) आहे.',

            'events.kicker': 'मंगल सोहळे',
            'events.title': 'कार्यक्रम',
            'events.onwards': '{time} पासून',
            'events.range': '{start} ते {end}',
            'events.muhurat': 'शुभ मुहूर्त',
            'events.dressCode': 'पेहराव',
            'events.venue': 'स्थळ',
            'events.directions': 'मार्ग पाहा',
            'events.addToCalendar': 'कॅलेंडरमध्ये जोडा',
            'events.calendarMenu': 'कॅलेंडर निवडा',
            'events.google': 'Google कॅलेंडर',
            'events.ics': 'Apple / Outlook (.ics)',
            'events.allToCalendar': 'सर्व कार्यक्रम कॅलेंडरमध्ये जोडा',

            'venue.kicker': 'मंगल स्थळ',
            'venue.title': 'कार्यस्थळ',
            'venue.showMap': 'नकाशा पाहा',
            'venue.directions': 'मार्ग पाहा',
            'venue.copy': 'पत्ता कॉपी करा',
            'venue.copied': 'पत्ता कॉपी झाला',
            'venue.mapTitle': '{venue} चा नकाशा',
            'venue.hosting': 'येथे होणारे कार्यक्रम',

            'guide.kicker': 'आपल्या सोयीसाठी',
            'guide.title': 'पाहुण्यांसाठी माहिती',
            'guide.dressCode': 'पेहराव',
            'guide.contacts': 'कोणत्याही मदतीसाठी संपर्क',
            'guide.call': '{name} यांना कॉल करा',
            'guide.whatsapp': '{name} यांना व्हॉट्सॲप करा',

            'gallery.kicker': 'आठवणी',
            'gallery.title': 'क्षणचित्रे',
            'gallery.open': 'फोटो {n} / {total} उघडा',
            'gallery.dialog': 'फोटो दालन',
            'gallery.close': 'बंद करा',
            'gallery.next': 'पुढचा फोटो',
            'gallery.prev': 'मागचा फोटो',
            'gallery.counter': '{n} / {total}',
            'gallery.swipe': 'आणखी फोटोंसाठी सरकवा',

            'rsvp.kicker': 'आपली उपस्थिती',
            'rsvp.title': 'आपण येणार ना?',
            'rsvp.deadline': 'कृपया {date} पर्यंत कळवा',
            'rsvp.name': 'आपले नाव',
            'rsvp.namePlaceholder': 'पूर्ण नाव',
            'rsvp.attending': 'आपण उपस्थित राहणार का?',
            'rsvp.yes': 'नक्की येणार',
            'rsvp.no': 'येणे शक्य नाही',
            'rsvp.guests': 'एकूण पाहुणे',
            'rsvp.guestsHint': 'आपल्यासह, जास्तीत जास्त {max}',
            'rsvp.fewer': 'एक पाहुणा कमी',
            'rsvp.more': 'एक पाहुणा जास्त',
            'rsvp.events': 'कोणत्या कार्यक्रमांना येणार?',
            'rsvp.diet': 'भोजन पसंती',
            'rsvp.diet.veg': 'शाकाहारी',
            'rsvp.diet.jain': 'जैन',
            'rsvp.diet.vegan': 'व्हेगन',
            'rsvp.diet.nonveg': 'मांसाहारी',
            'rsvp.phone': 'फोन (ऐच्छिक)',
            'rsvp.message': 'वधू-वरांसाठी शुभेच्छा (ऐच्छिक)',
            'rsvp.submit': 'उत्तर पाठवा',
            'rsvp.submitWhatsapp': 'व्हॉट्सॲपवर पाठवा',
            'rsvp.sending': 'पाठवत आहे…',
            'rsvp.thanksYes': 'धन्यवाद, {name}! आपल्या स्वागतासाठी आम्ही उत्सुक आहोत.',
            'rsvp.thanksNo': 'धन्यवाद, {name}. आपली उणीव जाणवेल. आपले आशीर्वाद आमच्यासाठी मोलाचे आहेत.',
            'rsvp.whatsappOpened': 'आपले उत्तर व्हॉट्सॲपमध्ये तयार आहे. कृपया तिथे “पाठवा” दाबा.',
            'rsvp.change': 'उत्तर बदला',
            'rsvp.closed': 'उत्तर देण्याची मुदत संपली आहे. कृपया कुटुंबीयांशी थेट संपर्क साधा.',
            'rsvp.error.summary': 'कृपया चिन्हांकित माहिती तपासा.',
            'rsvp.error.name': 'कृपया आपले नाव लिहा.',
            'rsvp.error.attending': 'कृपया एक पर्याय निवडा.',
            'rsvp.error.guests': 'कृपया १ ते {max} पाहुणे निवडा.',
            'rsvp.error.events': 'कृपया किमान एक कार्यक्रम निवडा.',
            'rsvp.error.phone': 'कृपया योग्य फोन नंबर लिहा, किंवा रिकामे ठेवा.',
            'rsvp.error.network': 'उत्तर पाठवता आले नाही. कृपया इंटरनेट तपासून पुन्हा प्रयत्न करा.',
            'rsvp.wa.title': '{couple} — उपस्थिती',
            'rsvp.wa.name': 'नाव',
            'rsvp.wa.attending': 'उपस्थिती',
            'rsvp.wa.guests': 'पाहुणे',
            'rsvp.wa.events': 'कार्यक्रम',
            'rsvp.wa.diet': 'भोजन',
            'rsvp.wa.message': 'शुभेच्छा',
            'rsvp.wa.yes': 'होय',
            'rsvp.wa.no': 'नाही',

            'thankyou.kicker': 'प्रेमपूर्वक',
            'thankyou.title': 'धन्यवाद',
            'thankyou.message': 'आपले प्रेम आणि आशीर्वाद हीच आमच्यासाठी सर्वात मोठी भेट. आपल्या उपस्थितीची आतुरतेने वाट पाहत आहोत.',
            'footer.made': 'प्रेमाने साकारले',
            'footer.create': 'आपले निमंत्रण तयार करा',

            'music.play': 'संगीत सुरू करा',
            'music.pause': 'संगीत थांबवा',
            'music.hint': 'संगीतासाठी स्पर्श करा',
            'lang.label': 'भाषा',
        },

        hi: {
            'loading': 'आपका निमंत्रण तैयार हो रहा है',
            'skip': 'सीधे निमंत्रण पर जाएँ',
            'notFound.title': 'यह निमंत्रण लिंक अधूरा लगता है',
            'notFound.body': 'शेयर करते समय लिंक कट गया होगा। कृपया परिवार से पूरा लिंक दोबारा भेजने को कहें।',
            'notFound.cta': 'अपना निमंत्रण बनाएँ',

            'envelope.for': 'सादर आमंत्रण',
            'envelope.invited': 'आपको सादर आमंत्रण',
            'envelope.open': 'निमंत्रण खोलें',
            'envelope.hint': 'खोलने के लिए मुहर को छुएँ',

            'hero.weddingOf': 'शुभ विवाह',
            'hero.engagementOf': 'सगाई',
            'hero.dear': 'प्रिय',
            'hero.scroll': 'आगे देखें',
            'joiner': 'संग',
            'and': 'एवं',

            'announcement.kicker': 'सादर नमस्कार',
            'announcement.title': 'सादर आमंत्रण',

            'couple.kicker': 'दो दिल, एक सफ़र',
            'couple.title': 'वर और वधू',
            'couple.groom': 'वर',
            'couple.bride': 'वधू',
            'couple.partner': 'जीवनसाथी',
            'couple.sonOf': '{parents} के सुपुत्र',
            'couple.daughterOf': '{parents} की सुपुत्री',
            'couple.childOf': '{parents} की संतान',

            'families.kicker': 'बड़ों के आशीर्वाद से',
            'families.title': 'हमारा परिवार',
            'families.groomSide': 'वर पक्ष',
            'families.brideSide': 'वधू पक्ष',
            'families.blessings': 'शुभाशीर्वाद',
            'families.hosts': 'निवेदक',
            'families.welcome': 'दर्शनाभिलाषी',

            'countdown.kicker': 'शुभ दिन',
            'countdown.title': 'शुभ घड़ी की प्रतीक्षा',
            'countdown.days': 'दिन',
            'countdown.hours': 'घंटे',
            'countdown.minutes': 'मिनट',
            'countdown.seconds': 'सेकंड',
            'countdown.left': '{days} दिन, {hours} घंटे शेष',
            'countdown.today': 'आज शुभ दिन है!',
            'countdown.done': 'शुभ विवाह संपन्न। आपके आशीर्वाद के लिए हार्दिक धन्यवाद।',
            'countdown.yourTime': 'आपके समय अनुसार यह {date} को {time} ({zone}) है।',

            'events.kicker': 'मंगल उत्सव',
            'events.title': 'कार्यक्रम',
            'events.onwards': '{time} से',
            'events.range': '{start} से {end} तक',
            'events.muhurat': 'शुभ मुहूर्त',
            'events.dressCode': 'परिधान',
            'events.venue': 'स्थान',
            'events.directions': 'रास्ता देखें',
            'events.addToCalendar': 'कैलेंडर में जोड़ें',
            'events.calendarMenu': 'कैलेंडर चुनें',
            'events.google': 'Google कैलेंडर',
            'events.ics': 'Apple / Outlook (.ics)',
            'events.allToCalendar': 'सभी कार्यक्रम कैलेंडर में जोड़ें',

            'venue.kicker': 'शुभ स्थान',
            'venue.title': 'कार्यक्रम स्थल',
            'venue.showMap': 'नक्शा देखें',
            'venue.directions': 'रास्ता देखें',
            'venue.copy': 'पता कॉपी करें',
            'venue.copied': 'पता कॉपी हो गया',
            'venue.mapTitle': '{venue} का नक्शा',
            'venue.hosting': 'यहाँ होने वाले कार्यक्रम',

            'guide.kicker': 'आपकी सुविधा के लिए',
            'guide.title': 'अतिथि सूचना',
            'guide.dressCode': 'परिधान',
            'guide.contacts': 'किसी भी सहायता के लिए संपर्क करें',
            'guide.call': '{name} को कॉल करें',
            'guide.whatsapp': '{name} को व्हाट्सऐप करें',

            'gallery.kicker': 'यादें',
            'gallery.title': 'हमारे पल',
            'gallery.open': 'फ़ोटो {n} / {total} खोलें',
            'gallery.dialog': 'फ़ोटो दीर्घा',
            'gallery.close': 'बंद करें',
            'gallery.next': 'अगली फ़ोटो',
            'gallery.prev': 'पिछली फ़ोटो',
            'gallery.counter': '{n} / {total}',
            'gallery.swipe': 'और फ़ोटो के लिए स्वाइप करें',

            'rsvp.kicker': 'आपकी उपस्थिति',
            'rsvp.title': 'क्या आप पधारेंगे?',
            'rsvp.deadline': 'कृपया {date} तक सूचित करें',
            'rsvp.name': 'आपका नाम',
            'rsvp.namePlaceholder': 'पूरा नाम',
            'rsvp.attending': 'क्या आप उपस्थित रहेंगे?',
            'rsvp.yes': 'अवश्य आएँगे',
            'rsvp.no': 'आना संभव नहीं',
            'rsvp.guests': 'कुल अतिथि',
            'rsvp.guestsHint': 'आपको मिलाकर, अधिकतम {max}',
            'rsvp.fewer': 'एक अतिथि कम',
            'rsvp.more': 'एक अतिथि अधिक',
            'rsvp.events': 'किन कार्यक्रमों में आएँगे?',
            'rsvp.diet': 'भोजन पसंद',
            'rsvp.diet.veg': 'शाकाहारी',
            'rsvp.diet.jain': 'जैन',
            'rsvp.diet.vegan': 'वीगन',
            'rsvp.diet.nonveg': 'मांसाहारी',
            'rsvp.phone': 'फ़ोन (वैकल्पिक)',
            'rsvp.message': 'वर-वधू के लिए शुभकामनाएँ (वैकल्पिक)',
            'rsvp.submit': 'उत्तर भेजें',
            'rsvp.submitWhatsapp': 'व्हाट्सऐप पर भेजें',
            'rsvp.sending': 'भेजा जा रहा है…',
            'rsvp.thanksYes': 'धन्यवाद, {name}! आपके स्वागत की प्रतीक्षा रहेगी।',
            'rsvp.thanksNo': 'धन्यवाद, {name}। आपकी कमी खलेगी। आपका आशीर्वाद हमारे लिए अनमोल है।',
            'rsvp.whatsappOpened': 'आपका उत्तर व्हाट्सऐप में तैयार है। कृपया वहाँ “भेजें” दबाएँ।',
            'rsvp.change': 'उत्तर बदलें',
            'rsvp.closed': 'उत्तर देने की समय-सीमा समाप्त हो गई है। कृपया परिवार से सीधे संपर्क करें।',
            'rsvp.error.summary': 'कृपया चिह्नित जानकारी जाँचें।',
            'rsvp.error.name': 'कृपया अपना नाम लिखें।',
            'rsvp.error.attending': 'कृपया एक विकल्प चुनें।',
            'rsvp.error.guests': 'कृपया 1 से {max} अतिथि चुनें।',
            'rsvp.error.events': 'कृपया कम से कम एक कार्यक्रम चुनें।',
            'rsvp.error.phone': 'कृपया सही फ़ोन नंबर लिखें, या खाली छोड़ दें।',
            'rsvp.error.network': 'उत्तर नहीं भेजा जा सका। कृपया इंटरनेट जाँचकर फिर कोशिश करें।',
            'rsvp.wa.title': '{couple} — उपस्थिति',
            'rsvp.wa.name': 'नाम',
            'rsvp.wa.attending': 'उपस्थिति',
            'rsvp.wa.guests': 'अतिथि',
            'rsvp.wa.events': 'कार्यक्रम',
            'rsvp.wa.diet': 'भोजन',
            'rsvp.wa.message': 'शुभकामनाएँ',
            'rsvp.wa.yes': 'हाँ',
            'rsvp.wa.no': 'नहीं',

            'thankyou.kicker': 'सप्रेम',
            'thankyou.title': 'धन्यवाद',
            'thankyou.message': 'आपका स्नेह और आशीर्वाद ही हमारे लिए सबसे बड़ा उपहार है। आपकी उपस्थिति की प्रतीक्षा रहेगी।',
            'footer.made': 'प्रेम से बनाया गया',
            'footer.create': 'अपना निमंत्रण बनाएँ',

            'music.play': 'संगीत चलाएँ',
            'music.pause': 'संगीत रोकें',
            'music.hint': 'संगीत के लिए छुएँ',
            'lang.label': 'भाषा',
        },
    };

    /* ---------- Helpers ---------- */

    const DEVA_DIGITS = '०१२३४५६७८९';
    const toDeva = (s) => String(s).replace(/[0-9]/g, (d) => DEVA_DIGITS[d]);

    function interpolate(str, vars) {
        if (!vars) return str;
        return str.replace(/\{([a-zA-Z0-9_.]+)\}/g, (m, key) =>
            (Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null) ? String(vars[key]) : m);
    }

    function parseDate(iso) {
        const m = typeof iso === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
        if (!m) return null;
        const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        return d.getUTCMonth() === +m[2] - 1 ? d : null;
    }

    function parseTime(hhmm) {
        const m = typeof hhmm === 'string' && /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
        if (!m) return null;
        const h = +m[1], min = +m[2];
        return h < 24 && min < 60 ? { h, min } : null;
    }

    // Marathi / Hindi time-of-day words, the way printed cards write them.
    function dayPeriod(lang, h) {
        if (lang === 'mr') {
            if (h < 4) return 'रात्री';
            if (h < 6) return 'पहाटे';
            if (h < 12) return 'सकाळी';
            if (h < 16) return 'दुपारी';
            if (h < 20) return 'सायंकाळी';
            return 'रात्री';
        }
        if (lang === 'hi') {
            if (h < 4) return 'रात';
            if (h < 12) return 'सुबह';
            if (h < 16) return 'दोपहर';
            if (h < 20) return 'शाम';
            return 'रात';
        }
        return '';
    }

    const formatterCache = new Map();
    function dtf(locale, options) {
        const key = locale + JSON.stringify(options);
        if (!formatterCache.has(key)) formatterCache.set(key, new Intl.DateTimeFormat(locale, options));
        return formatterCache.get(key);
    }

    /* ---------- Factory ---------- */

    // create({ lang, fallback, numerals, layers: [templateStrings, configLabels] })
    function create(options) {
        const opts = options || {};
        const lang = LANGS[opts.lang] ? opts.lang : 'en';
        const fallback = LANGS[opts.fallback] ? opts.fallback : 'en';
        const meta = LANGS[lang];
        const digits = opts.numerals === 'native' ? meta.nativeDigits
            : opts.numerals === 'latin' ? 'latn'
                : DEFAULT_DIGITS[lang];
        const locale = `${meta.locale}-u-nu-${digits}`;
        const layers = (opts.layers || []).filter(Boolean);

        const num = (value) => (digits === 'deva' ? toDeva(value) : String(value));

        function lookup(key, l) {
            for (let i = layers.length - 1; i >= 0; i--) {
                const layer = layers[i][l];
                if (layer && typeof layer[key] === 'string') return layer[key];
            }
            return STRINGS[l] && STRINGS[l][key];
        }

        function t(key, vars) {
            const str = lookup(key, lang) ?? lookup(key, fallback) ?? lookup(key, 'en') ?? key;
            return interpolate(str, vars);
        }

        // Resolves a content value (string or { en, mr, hi, '*' }) to a string.
        function text(value, vars) {
            if (value == null) return '';
            if (typeof value === 'string' || typeof value === 'number') return interpolate(String(value), vars);
            if (typeof value !== 'object' || Array.isArray(value)) return '';
            const pick = value[lang] ?? value['*'] ?? value[fallback] ?? value.en
                ?? Object.keys(value).map((k) => value[k]).find((v) => typeof v === 'string');
            return typeof pick === 'string' ? interpolate(pick, vars) : '';
        }

        // Which language a resolved content value actually came from, so a
        // Marathi page can still mark an English-only line with lang="en".
        function sourceLang(value) {
            if (value == null || typeof value !== 'object') return lang;
            if (typeof value[lang] === 'string') return lang;
            if (typeof value['*'] === 'string') return value['@lang'] || lang;
            if (typeof value[fallback] === 'string') return fallback;
            return typeof value.en === 'string' ? 'en' : lang;
        }

        const has = (value) => text(value).trim() !== '';

        function date(iso, style) {
            const d = parseDate(iso);
            if (!d) return '';
            const s = style || 'full';
            const base = { timeZone: 'UTC' };
            if (s === 'weekday') return dtf(locale, { ...base, weekday: 'long' }).format(d);
            if (s === 'dayMonth') return dtf(locale, { ...base, day: 'numeric', month: 'long' }).format(d);
            if (s === 'short') return dtf(locale, { ...base, day: 'numeric', month: 'short' }).format(d);
            if (s === 'long') return dtf(locale, { ...base, day: 'numeric', month: 'long', year: 'numeric' }).format(d);
            if (s === 'numeric') {
                const pad = (n) => String(n).padStart(2, '0');
                return num(`${pad(d.getUTCDate())} · ${pad(d.getUTCMonth() + 1)} · ${d.getUTCFullYear()}`);
            }
            return dtf(locale, { ...base, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        }

        function dateParts(iso) {
            const d = parseDate(iso);
            if (!d) return null;
            const base = { timeZone: 'UTC' };
            return {
                weekday: dtf(locale, { ...base, weekday: 'long' }).format(d),
                day: num(d.getUTCDate()),
                month: dtf(locale, { ...base, month: 'long' }).format(d),
                monthShort: dtf(locale, { ...base, month: 'short' }).format(d),
                year: num(d.getUTCFullYear()),
            };
        }

        // en "4 PM" · "12:31 PM"
        // mr "सायंकाळी ४ वाजता" · "दुपारी १२:३१"
        // hi "शाम 4 बजे" · "दोपहर 12:31 बजे"
        function clock(h, min, opts2) {
            const o = opts2 || {};
            const h12 = ((h + 11) % 12) + 1;
            const mm = String(min).padStart(2, '0');
            if (lang === 'en') return `${h12}${min ? ':' + mm : ''} ${h < 12 ? 'AM' : 'PM'}`;
            const digitsPart = num(min ? `${h12}:${mm}` : `${h12}`);
            const core = o.noPeriod ? digitsPart : `${dayPeriod(lang, h)} ${digitsPart}`;
            if (o.noSuffix) return core;
            if (lang === 'hi') return `${core} बजे`;
            return min ? core : `${core} वाजता`;
        }

        function time(hhmm) {
            const p = parseTime(hhmm);
            return p ? clock(p.h, p.min) : '';
        }

        function onwardsFrom(p) {
            if (lang === 'mr') {
                // "सायंकाळी ४ वाजल्यापासून" / "सायंकाळी ४:३० पासून"
                return p.min ? `${clock(p.h, p.min, { noSuffix: true })} पासून`
                    : `${clock(p.h, 0, { noSuffix: true })} वाजल्यापासून`;
            }
            return t('events.onwards', { time: clock(p.h, p.min) });
        }

        function timeRange(start, end, onwards) {
            const s = parseTime(start);
            if (!s) return '';
            const e = parseTime(end);
            if (!e) return onwards ? onwardsFrom(s) : clock(s.h, s.min);
            const samePeriod = lang !== 'en' && dayPeriod(lang, s.h) === dayPeriod(lang, e.h);
            return t('events.range', {
                start: clock(s.h, s.min, { noSuffix: true }),
                end: clock(e.h, e.min, { noPeriod: samePeriod, noSuffix: true }),
            });
        }

        // Spelled-out muhurat time for formal prose:
        // "दुपारी १२ वाजून ३१ मिनिटांनी" · "दोपहर 12 बजकर 31 मिनट पर" · "at 12:31 PM"
        function timeLong(hhmm) {
            const p = parseTime(hhmm);
            if (!p) return '';
            const h12 = ((p.h + 11) % 12) + 1;
            if (lang === 'mr') {
                return p.min
                    ? `${dayPeriod('mr', p.h)} ${num(h12)} वाजून ${num(p.min)} मिनिटांनी`
                    : `${dayPeriod('mr', p.h)} ${num(h12)} वाजता`;
            }
            if (lang === 'hi') {
                return p.min
                    ? `${dayPeriod('hi', p.h)} ${num(h12)} बजकर ${num(p.min)} मिनट पर`
                    : `${dayPeriod('hi', p.h)} ${num(h12)} बजे`;
            }
            return `at ${clock(p.h, p.min)}`;
        }

        // Formats an absolute instant in any IANA zone (used for the guest's
        // own time zone hint).
        function instant(utcMs, timeZone) {
            const tz = timeZone || 'Asia/Kolkata';
            try {
                const parts = dtf('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    .formatToParts(new Date(utcMs));
                const get = (type) => (parts.find((p) => p.type === type) || {}).value;
                return {
                    date: date(`${get('year')}-${get('month')}-${get('day')}`, 'dayMonth'),
                    time: clock(+get('hour') % 24, +get('minute')),
                };
            } catch (e) {
                return { date: '', time: '' };
            }
        }

        return {
            lang, fallback, locale, digits,
            dir: meta.dir, script: meta.script, label: meta.label,
            t, text, has, sourceLang, num,
            date, dateParts, time, timeRange, timeLong, instant,
            interpolate,
        };
    }

    WL.i18n = {
        LANGS,
        STRINGS,
        create,
        isSupported: (lang) => Object.prototype.hasOwnProperty.call(LANGS, lang),
        parseDate,
        parseTime,
        toDeva,
        // Lets a template add or override core strings: WL.i18n.extend({ en: {...}, mr: {...} })
        extend(strings) {
            Object.keys(strings || {}).forEach((l) => {
                STRINGS[l] = Object.assign(STRINGS[l] || {}, strings[l]);
            });
        },
    };
})(window);
