const headContent = [
    { tag: 'meta', attrs: { charset: 'UTF-8' } },
    { tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1.0' } },
    { tag: 'base', attrs: { href: '/Brozyzz/frontend/' } },
    { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' } },
    { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' } },
    { tag: 'link', attrs: { rel: 'stylesheet', href: 'assets/css/styles.css' } },
    { tag: 'script', attrs: { src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js' } },
];

headContent.forEach(({ tag, attrs }) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
    document.head.appendChild(el);
});
