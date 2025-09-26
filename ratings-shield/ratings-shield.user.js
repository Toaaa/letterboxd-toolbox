// ==UserScript==
// @name         Letterboxd Ratings Shield
// @namespace    https://github.com/Toaaa/
// @version      1.3
// @description  Hide ratings & popular reviews if a movie is not yet watched on Letterboxd.
// @author       Toaaa
// @license      MIT (https://github.com/Toaaa/letterboxd-toolbox/blob/main/LICENSE)
// @match        https://letterboxd.com/film/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Toaaa/letterboxd-toolbox/main/ratings-shield/ratings-shield.user.js
// @downloadURL  https://raw.githubusercontent.com/Toaaa/letterboxd-toolbox/main/ratings-shield/ratings-shield.user.js
// @supportURL  https://github.com/Toaaa/letterboxd-toolbox/issues
// ==/UserScript==

(function () {
    'use strict';

    const DEBUG = true;

    const SELECTORS = {
        ratingsSection: '.ratings-histogram-chart',
        popularSection: '.film-reviews.section.js-popular-reviews',
        actionsRow: '.actions-row1'
    };

    let isHidden = true;

    const debug = (...args) => {
        if (DEBUG) console.debug('[LB RatingsShield]', ...args);
    };

    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    const updateRatingsVisibility = () => {
        const ratingsSection = document.querySelector(SELECTORS.ratingsSection);
        if (!ratingsSection) {
            debug('Ratings section not found.');
            return;
        }
        ratingsSection.style.setProperty('display', isHidden ? 'none' : 'block', 'important');
        debug(`Ratings section visibility set to: ${isHidden ? 'hidden' : 'visible'}`);

        const popularSection = document.querySelector(SELECTORS.popularSection);
        if (popularSection) {
            popularSection.style.setProperty('display', isHidden ? 'none' : 'block', 'important');
            debug(`Popular section visibility set to: ${isHidden ? 'hidden' : 'visible'}`);
        }
    };

    const checkStatus = () => {
        const actionsRow = document.querySelector(SELECTORS.actionsRow);
        if (!actionsRow) {
            debug('Actions row not found.');
            return;
        }

        const firstActionText = actionsRow.innerText.toLowerCase().split('\n')[0].trim();
        debug('Current action:', firstActionText);

        if (['watched', 'reviewed', 'logged'].includes(firstActionText)) {
            if (isHidden) {
                isHidden = false;
                updateRatingsVisibility();
            }
        } else if (firstActionText === 'watch') {
            if (!isHidden) {
                isHidden = true;
                updateRatingsVisibility();
            }
        } else {
            debug('Action is neither watched nor watch; no visibility change.');
        }
    };

    const injectInitialCSS = () => {
        const style = document.createElement('style');
        style.textContent = `
            ${SELECTORS.ratingsSection},
            ${SELECTORS.popularSection} {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        debug('Initial CSS injected to hide ratings and popular reviews sections.');
    };

    const setupDOMObserver = () => {
        const observer = new MutationObserver(debounce(() => {
            checkStatus();
        }, 250));

        observer.observe(document.body, { childList: true, subtree: true });
        debug('MutationObserver set up.');
    };

    const setupHistoryObserver = () => {
        const originalPush = history.pushState;
        const originalReplace = history.replaceState;

        const onHistoryChange = () => {
            debug('History change detected, rechecking status...');
            isHidden = true;
            updateRatingsVisibility();
            checkStatus();
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
    };

    const init = () => {
        injectInitialCSS();
        checkStatus();
        setupDOMObserver();
        setupHistoryObserver();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
