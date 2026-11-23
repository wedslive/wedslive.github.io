(async () => {
    const wrap = document.querySelector('.rj-sec--countdown [data-wl-cal]');
    const btn = wrap.querySelector('.wl-cal__toggle');
    wrap.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 300));
    const r = btn.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    btn.click();
    await new Promise((r2) => setTimeout(r2, 100));
    const menu = wrap.querySelector('.wl-cal__menu');
    return JSON.stringify({
        hit: hit && (hit.className && hit.className.baseVal !== undefined ? hit.className.baseVal : hit.className),
        hitTag: hit && hit.tagName,
        expanded: btn.getAttribute('aria-expanded'),
        hidden: menu.hidden,
        google: menu.querySelector('a').href,
        menus: document.querySelectorAll('[data-wl-cal]').length,
    });
})()
