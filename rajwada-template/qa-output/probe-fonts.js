(() => {
    const rows = performance.getEntriesByType('resource')
        .filter((r) => /gstatic|googleapis/.test(r.name))
        .map((r) => `${Math.round((r.transferSize || r.encodedBodySize) / 1024)}KB ${r.name.replace('https://fonts.gstatic.com/s/', '').slice(0, 70)}`);
    const faces = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style} [${f.unicodeRange.slice(0, 30)}]`);
    return rows.join('\n') + '\n--- loaded faces\n' + faces.join('\n');
})()
