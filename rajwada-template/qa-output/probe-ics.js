(async () => {
    const out = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
        if (this.download) { out.push({ name: this.download, href: this.href }); }
        return orig.call(this);
    };
    const origRevoke = URL.revokeObjectURL;
    document.querySelector('.rj-sec--events [data-wl-ics="all"]').click();
    const d = out[0];
    let text = '';
    let err = '';
    try { text = await (await fetch(d.href)).text(); } catch (e) { err = e.message; }
    return JSON.stringify({ name: d && d.name, href: d && d.href.slice(0, 40), events: (text.match(/BEGIN:VEVENT/g) || []).length, err, sample: text.slice(0, 120) });
})()
