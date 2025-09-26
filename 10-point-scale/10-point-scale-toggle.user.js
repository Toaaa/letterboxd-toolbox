// ==UserScript==
// @name         10-Point Scale Rating (Toggle)
// @namespace    https://github.com/Toaaa
// @version      1.3
// @description  Toggle between 5-star and 10-point rating on Letterboxd.
// @author       Toaaa
// @license      MIT (https://github.com/Toaaa/letterboxd-toolbox/blob/main/LICENSE)
// @match        *://letterboxd.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Toaaa/letterboxd-toolbox/main/10-point-scale/10-point-scale-toggle.user.js
// @downloadURL  https://raw.githubusercontent.com/Toaaa/letterboxd-toolbox/main/10-point-scale/10-point-scale-toggle.user.js
// @supportURL  https://github.com/Toaaa/letterboxd-toolbox/issues
// ==/UserScript==

(function () {
    'use strict';

    const DEBUG = false;

    const SELECTORS = [
        '.tooltip.display-rating',
        '.average-rating p.display-rating'
    ];

    const DATA_ATTR = 'ratingBaseToggleInit';

    const STORAGE_KEY = 'letterboxdToggleBase10';

    const debug = (...args) => DEBUG && console.debug('[LB Rating Toggle]', ...args);

    const waitForAnyElement = (selectors, timeout = 10000) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for selectors: ${selectors.join(', ')}`));
        }, timeout);

        const observer = new MutationObserver(() => {
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve(el);
                    return;
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
                clearTimeout(timer);
                observer.disconnect();
                resolve(el);
                return;
            }
        }
    });

    const toBase10 = rating => Math.min(rating * 2, 10).toFixed(1);

    const addToggleButton = (ratingEl) => {
        if (ratingEl.dataset[DATA_ATTR] === 'true') {
            debug('Toggle already initialized on this element.');
            return;
        }

        const originalText = ratingEl.textContent.trim();
        const ratingValue = parseFloat(originalText);
        let showingBase10 = localStorage.getItem(STORAGE_KEY) === 'true';


        if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
            debug('Invalid rating value:', originalText);
            return;
        }

        const base10Text = toBase10(ratingValue);

        const container = document.createElement('span');
        Object.assign(container.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
        });

        const ratingSpan = document.createElement('span');
        ratingSpan.textContent = showingBase10 ? base10Text : originalText;
        ratingSpan.setAttribute('aria-label', `Rating: ${originalText} stars`);

        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '⇄';
        toggleBtn.title = 'Toggle between 5-star and 10-point rating';
        Object.assign(toggleBtn.style, {
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.8em',
            padding: '0',
            opacity: '0.7',
            color: '#778899',
        });

        toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.opacity = '1');
        toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.opacity = '0.7');

        toggleBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            showingBase10 = !showingBase10;
            localStorage.setItem(STORAGE_KEY, showingBase10);
            ratingSpan.textContent = showingBase10 ? base10Text : originalText;
            ratingSpan.setAttribute('aria-label',
                `Rating: ${showingBase10 ? base10Text + ' out of 10' : originalText + ' stars'}`);
        });

        container.append(ratingSpan, toggleBtn);
        ratingEl.textContent = '';
        ratingEl.appendChild(container);

        ratingEl.dataset[DATA_ATTR] = 'true';

        debug('Toggle button added for rating:', originalText);
    }

    const initialize = async () => {
        try {
            debug('Initializing...');
            const ratingEl = await waitForAnyElement(SELECTORS);
            if (ratingEl) addToggleButton(ratingEl);
        } catch (err) {
            console.warn('[LB Rating Toggle] Initialization error:', err);
        }
    }

    const setupMutationObserver = () => {
        const observer = new MutationObserver(() => {
            for (const sel of SELECTORS) {
                document.querySelectorAll(sel).forEach(el => {
                    if (el.dataset[DATA_ATTR] !== 'true') {
                        debug('New rating element detected, injecting toggle.');
                        addToggleButton(el);
                    }
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        debug('MutationObserver set up.');
    }

    const setupHistoryHooks = () => {
        const originalPush = history.pushState;
        const originalReplace = history.replaceState;

        const onHistoryChange = () => {
            debug('History state changed, resetting toggles.');
            document.querySelectorAll(`[data-${DATA_ATTR}]`).forEach(el => {
                delete el.dataset[DATA_ATTR];
            });
            initialize();
        };

        history.pushState = function (...args) {
            const result = originalPush.apply(this, args);
            onHistoryChange();
            return result;
        };

        history.replaceState = function (...args) {
            const result = originalReplace.apply(this, args);
            onHistoryChange();
            return result;
        };

        window.addEventListener('popstate', onHistoryChange);
        debug('History API hooks installed.');
    }

    const init = () => {
        initialize();
        setupMutationObserver();
        setupHistoryHooks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
