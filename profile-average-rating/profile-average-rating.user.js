// ==UserScript==
// @name         Profile Average Rating
// @namespace    https://github.com/Toaaa
// @version      1.2
// @description  Display weighted average rating from histogram on Letterboxd user profiles
// @author       Toaaa
// @license      MIT (https://github.com/Toaaa/letterboxd-toolbox/blob/main/LICENSE)
// @match        *://letterboxd.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const DEBUG = false;

    const SELECTORS = {
        section: '.ratings-histogram-chart',
        bars: '.rating-histogram-bar a',
        inserted: 'averageInserted'
    };

    const PATH_REGEX = /^\/[^\/]+\/$/;

    const debug = (...args) => DEBUG && console.debug('[LB AvgRating]', ...args);

    const isUserProfilePage = () => PATH_REGEX.test(location.pathname);

    const parseRating = (href) => {
        try {
            const decoded = decodeURIComponent(href);
            const match = decoded.match(/\/rated\/(\d)?(½)?\//);
            if (!match) return null;
            const whole = match[1] ? parseInt(match[1], 10) : 0;
            return whole + (match[2] ? 0.5 : 0);
        } catch {
            return null;
        }
    };

    const parseCount = (text) => {
        const match = text.trim().match(/^(\d+)/);
        return match ? parseInt(match[1].replace(',', ''), 10) : null;
    };

    const getHistogramStats = () => {
        const bars = document.querySelectorAll(SELECTORS.bars);
        if (!bars.length) return null;

        let total = 0;
        let weighted = 0;

        bars.forEach((bar) => {
            const rating = parseRating(bar.href);
            const count = parseCount(bar.textContent);
            if (rating !== null && count !== null) {
                weighted += rating * count;
                total += count;
            }
        });

        return total > 0 ? { average: weighted / total, total } : null;
    };

    const createAverageElement = ({ average, total }) => {
        const span = document.createElement('span');
        span.className = 'average-rating';
        span.style.marginLeft = '20px';

        const link = document.createElement('a');
        link.className = 'tooltip display-rating';
        link.href = 'films/rated/.5-5/';
        link.setAttribute(
            'data-original-title',
            `Weighted average of ${average.toFixed(2)} based on ${total.toLocaleString()} ratings`
        );

        const display = document.createElement('span');
        display.className = 'display-rating';
        display.style.display = 'inline-flex';
        display.style.alignItems = 'center';
        display.style.gap = '6px';
        display.textContent = average.toFixed(1);

        link.appendChild(display);
        span.appendChild(link);

        return span;
    };

    const insertAverageElement = () => {
        const section = document.querySelector(SELECTORS.section);
        if (!section || section.dataset[SELECTORS.inserted]) return;

        const stats = getHistogramStats();
        if (!stats) return debug('Failed to calculate average');

        const element = createAverageElement(stats);

        const heading = section.querySelector('h2.section-heading');
        if (heading?.parentNode) {
            heading.parentNode.insertBefore(element, heading.nextSibling);
        } else {
            section.appendChild(element);
        }

        section.dataset[SELECTORS.inserted] = 'true';
        debug('Inserted average rating:', stats.average.toFixed(1));
    };

    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    const setupDOMObserver = () => {
        const observer = new MutationObserver(
            debounce(() => {
                if (isUserProfilePage()) insertAverageElement();
            }, 300)
        );

        observer.observe(document.body, { childList: true, subtree: true });
        debug('DOM observer initialized');
    };

    const setupHistoryObserver = () => {
        const originalPush = history.pushState;
        const originalReplace = history.replaceState;

        const handleChange = () => {
            document.querySelectorAll(`[data-${SELECTORS.inserted}]`)
                .forEach(el => delete el.dataset[SELECTORS.inserted]);

            if (isUserProfilePage()) insertAverageElement();
        };

        history.pushState = function (...args) {
            const result = originalPush.apply(this, args);
            handleChange();
            return result;
        };

        history.replaceState = function (...args) {
            const result = originalReplace.apply(this, args);
            handleChange();
            return result;
        };

        window.addEventListener('popstate', handleChange);
        debug('History observer initialized');
    };

    const init = () => {
        if (!isUserProfilePage()) return debug('Not a profile page, skipping');

        debug('Initializing on profile page');
        insertAverageElement();
        setupDOMObserver();
        setupHistoryObserver();
    };

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();

})();
