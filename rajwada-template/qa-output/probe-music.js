(async () => {
    const b = document.querySelector('.rj-hero__music');
    const log = [];
    const origError = console.error;
    window.addEventListener('unhandledrejection', (e) => log.push('rejection: ' + (e.reason && e.reason.message)));
    b.click();
    log.push('after click: ' + b.getAttribute('aria-pressed'));
    await new Promise((r) => setTimeout(r, 1500));
    log.push('after 1.5s: ' + b.getAttribute('aria-pressed') + ' hidden=' + b.hidden + ' playing=' + WL.music.playing);
    log.push('AudioContext: ' + typeof AudioContext);
    return log.join(' | ');
})()
