(() => {
    const toc = document.querySelector('.nexmoe-toc');
    if (!toc) {
        return;
    }

    const catalog = toc.closest('.catalog');
    const nav = document.createElement('nav');
    nav.className = 'article-toc';
    nav.setAttribute('aria-label', '文章目录');
    nav.innerHTML = `
        <h2 class="article-toc-title">文章目录</h2>
        <button class="article-toc-toggle mdui-fab" type="button"
            aria-controls="article-toc-list" aria-expanded="false"
            aria-label="展开文章目录">目录</button>
    `;
    toc.id = 'article-toc-list';
    nav.appendChild(toc);
    catalog.remove();
    document.body.appendChild(nav);
    document.body.classList.add('has-article-toc');

    const toggle = nav.querySelector('button');
    const list = toc.querySelector('ol');
    const links = Array.from(toc.querySelectorAll('a.toc-link'));
    const headings = links.map(link => {
        return document.getElementById(decodeURIComponent(link.hash.slice(1)));
    });
    const article = headings[0].closest('article');
    const desktop = window.matchMedia('(min-width: 1025px)');
    const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );
    let current = -1;
    let scheduled = false;

    function revealCurrent() {
        if (current < 0 || list.clientHeight === 0) {
            return;
        }
        const item = links[current].getBoundingClientRect();
        const bounds = list.getBoundingClientRect();
        if (item.top < bounds.top) {
            list.scrollTop += item.top - bounds.top;
        } else if (item.bottom > bounds.bottom) {
            list.scrollTop += item.bottom - bounds.bottom;
        }
    }

    function setExpanded(expanded) {
        nav.classList.toggle('is-open', expanded);
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label',
            expanded ? '收起文章目录' : '展开文章目录');
        if (expanded) {
            revealCurrent();
        }
    }

    function updateCurrent() {
        scheduled = false;
        const offset = Math.min(120, window.innerHeight / 4);
        let next = 0;
        headings.forEach((heading, index) => {
            if (heading.getBoundingClientRect().top <= offset) {
                next = index;
            }
        });
        if (window.scrollY > 0 &&
            article.getBoundingClientRect().bottom <= window.innerHeight) {
            next = headings.length - 1;
        }
        if (next === current) {
            return;
        }
        if (current >= 0) {
            links[current].removeAttribute('aria-current');
        }
        current = next;
        links[current].setAttribute('aria-current', 'location');
        revealCurrent();
    }

    function scheduleUpdate() {
        if (!scheduled) {
            scheduled = true;
            window.requestAnimationFrame(updateCurrent);
        }
    }

    toggle.addEventListener('click', () => {
        setExpanded(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !desktop.matches) {
            setExpanded(false);
            toggle.focus();
        }
    });
    nav.addEventListener('click', event => {
        const link = event.target.closest('a.toc-link');
        if (!link || event.button !== 0 || event.ctrlKey || event.metaKey ||
            event.shiftKey || event.altKey) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const heading = headings[links.indexOf(link)];
        window.scrollTo({
            top: window.scrollY + heading.getBoundingClientRect().top - 24,
            behavior: reducedMotion.matches ? 'instant' : 'smooth'
        });
        window.history.pushState(null, '', link.hash);
        if (!desktop.matches) {
            setExpanded(false);
            toggle.focus();
        }
    }, true);

    desktop.addEventListener('change', () => {
        setExpanded(false);
        revealCurrent();
        scheduleUpdate();
    });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);
    new ResizeObserver(scheduleUpdate).observe(article);
    updateCurrent();
})();
