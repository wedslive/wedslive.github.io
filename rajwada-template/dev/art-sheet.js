(function () {
    const A = WL.art.rajwada;
    const out = document.getElementById('out');
    const cell = (label, svg, cls) => `<div class="cell ${cls || ''}"><b>${label}</b>${svg}</div>`;
    const icons = Object.keys(A.icons).map((k) => `<div title="${k}">${A.icons[k]}</div>`).join('');
    const only = new URLSearchParams(location.search).get('only');
    if (only === 'frames') {
        out.innerHTML = A.defs() + `<div class="cell frames">${A.heroFrame(360, 780)}</div><div class="cell frames">${A.heroFrame(430, 932)}</div><div class="cell frames wide">${A.heroFrame(560, 760)}</div>`;
        return;
    }
    out.innerHTML = A.defs() + [
        cell('chhatri', A.chhatri()),
        cell('elephant', A.elephant('', false)),
        cell('elephant flipped', A.elephant('', true)),
        cell('lantern', A.lantern()),
        cell('seal latin', A.seal('A&G', 'latn')),
        cell('seal deva', A.seal('अ ग', 'deva')),
        cell('palace', A.palace(), 'wide'),
        cell('divider', A.divider()),
        cell('divider light', A.divider(), 'light'),
        cell('corner', A.corner()),
        cell('rosette', `<svg viewBox="-60 -60 120 120"><g class="rj-line">${A.rosette(56, 16)}</g></svg>`),
        cell('icons dark', `<div class="icons">${icons}</div>`, 'wide'),
        cell('icons light', `<div class="icons">${icons}</div>`, 'wide light'),
    ].join('');
})();
