// ==UserScript==
// @name         Readable Runtime
// @author       Toaaa
// @namespace    https://github.com/Toaaa
// @description  Replaces the original runtime with a formatted one, based on Tetrax-10's version.
// @license      MIT (https://github.com/Toaaa/letterboxd-toolbox/blob/main/LICENSE)
// @version      2.1.4
// @match        *://*.letterboxd.com/film/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Toaaa/letterboxd-toolbox/main/readable-runtime/readable-runtime.user.js
// @downloadURL  https://raw.githubusercontent.com/Toaaa/letterboxd-toolbox/main/readable-runtime/readable-runtime.user.js
// @supportURL  https://github.com/Toaaa/letterboxd-toolbox/issues
// ==/UserScript==

(() => {
    'use strict';

    const DEBUG = false;

    const CONTAINER_SELECTORS = ['.text-footer', '.movie-footer', 'footer'];

    const DATA_ATTR_FORMATTED = 'runtimeFormatted';

    const debugLog = (...args) => {
        if (DEBUG) console.debug('[Letterboxd Formatter]', ...args);
    };

    const formatRuntimeMinutes = (minStr) => {
        try {
            const match = minStr.match(/(\d+)\s*mins?/i);
            if (!match) return null;

            const totalMinutes = parseInt(match[1], 10);
            if (isNaN(totalMinutes) || totalMinutes < 0) return null;

            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            const parts = [];
            if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
            if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);

            const formatted = parts.join(' ');
            return totalMinutes >= 60
                ? `${formatted} / ${totalMinutes} mins`
                : `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
        } catch (err) {
            console.warn('[Letterboxd Runtime] Error formatting runtime:', err);
            return null;
        }
    };

    const isRuntimeParagraph = (paragraph) => {
        if (!paragraph?.textContent) return false;
        const text = paragraph.textContent.toLowerCase();
        return /\b\d+\s*mins?\b/.test(text) && text.includes('more at');
    };

    const findRuntimeParagraph = () => {
        for (const selector of CONTAINER_SELECTORS) {
            const container = document.querySelector(selector);
            if (container) {
                const paragraphs = Array.from(container.querySelectorAll('p'));
                const found = paragraphs.find(isRuntimeParagraph);
                if (found) {
                    debugLog('Runtime paragraph found in container:', selector);
                    return found;
                }
            }
        }
        const allParagraphs = Array.from(document.querySelectorAll('p'));
        const fallback = allParagraphs.find(isRuntimeParagraph);
        if (fallback) debugLog('Runtime paragraph found in fallback search.');
        return fallback || null;
    };

    const updateFooterRuntime = () => {
        try {
            const paragraph = findRuntimeParagraph();
            if (!paragraph) {
                debugLog('No runtime paragraph found.');
                return;
            }

            if (paragraph.dataset[DATA_ATTR_FORMATTED] === 'true') {
                debugLog('Runtime paragraph already formatted, skipping.');
                return;
            }

            for (const node of Array.from(paragraph.childNodes)) {
                if (node.nodeType === Node.TEXT_NODE && /\b\d+\s*mins?\b/i.test(node.textContent)) {
                    const originalText = node.textContent.trim();
                    const formatted = formatRuntimeMinutes(originalText);
                    if (formatted) {
                        node.textContent = originalText
                            .replace(/\b\d+\s*mins?\b/i, formatted)
                            .replace(/(More at)(?!\u00A0)/, '$1\u00A0');

                        paragraph.setAttribute('title', originalText);

                        paragraph.dataset[DATA_ATTR_FORMATTED] = 'true';

                        paragraph.setAttribute('aria-label', `Runtime: ${formatted}`);

                        debugLog('Runtime formatted:', formatted);
                    } else {
                        debugLog('Failed to format runtime from text:', originalText);
                    }
                    break;
                }
            }
        } catch (err) {
            console.warn('[Letterboxd Runtime] Error updating footer runtime:', err);
        }
    };

    const debounce = (func, wait) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const setupMutationObserver = () => {
        const observer = new MutationObserver(debounce(() => {
            debugLog('MutationObserver triggered, updating runtime.');
            updateFooterRuntime();
        }, 300));

        const observeTargets = CONTAINER_SELECTORS
            .map(sel => document.querySelector(sel))
            .filter(Boolean);

        if (observeTargets.length === 0) {
            observer.observe(document.body, { childList: true, subtree: true });
            debugLog('No specific container found, observing <body>.');
        } else {
            observeTargets.forEach(el => observer.observe(el, { childList: true, subtree: true }));
            debugLog('Observing containers for mutations:', observeTargets);
        }
    };

    const setupHistoryListener = () => {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        const onHistoryChange = () => {
            debugLog('History change detected, updating runtime.');
            document.querySelectorAll(`[data-${DATA_ATTR_FORMATTED}]`).forEach(el => {
                delete el.dataset[DATA_ATTR_FORMATTED];
            });
            updateFooterRuntime();
        };

        history.pushState = function (...args) {
            const result = originalPushState.apply(this, args);
            onHistoryChange();
            return result;
        };

        history.replaceState = function (...args) {
            const result = originalReplaceState.apply(this, args);
            onHistoryChange();
            return result;
        };

        window.addEventListener('popstate', onHistoryChange);

        debugLog('History API hooks installed.');
    };

    const init = () => {
        debugLog('Initializing Letterboxd Runtime Formatter.');
        updateFooterRuntime();
        setupMutationObserver();
        setupHistoryListener();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
