(() => {
    const w = document.querySelector('.rj-person__window');
    w.scrollIntoView();
    const a = w.getBoundingClientRect();
    const f = w.querySelector('.rj-person__frame').getBoundingClientRect();
    const p = w.querySelector('.rj-person__photo').getBoundingClientRect();
    const cp = getComputedStyle(w.querySelector('.rj-person__photo')).clipPath;
    const d = document.querySelector('#rj-clip-arch path').getAttribute('d').slice(0, 160);
    return JSON.stringify({ win: [a.width, a.height], frame: [f.left - a.left, f.top - a.top, f.width, f.height], photo: [p.width, p.height], cp, d });
})()
