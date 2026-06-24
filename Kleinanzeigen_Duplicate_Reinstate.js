// ==UserScript==
// @name          Kleinanzeigen - Anzeige duplizieren / neu einstellen
// @author        Michi / RIPENCE
// @description   Einfügen via F12 (Console) im "Anzeige bearbeiten" Modus. Stellt zwei Buttons "Anzeige duplizieren" und "Anzeige neu einstellen" zur Verfügung.
// @description   Anzeige duplizieren = Klonen // Anzeige neu einstellen = Anzeige klonen und alte Anzeige automatisch löschen
// @icon          http://www.google.com/s2/favicons?domain=www.kleinanzeigen.de
// @license       GNU Gernal Public License v3.0
// @version       3.1
// @match         https://www.kleinanzeigen.de/p-anzeige-bearbeiten.html*
// #fixedWithClaudeCode
// ==/UserScript==

(function () {
    'use strict';

    function waitForElement(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(selector);
            if (existing) return resolve(existing);
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) { observer.disconnect(); resolve(el); }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { observer.disconnect(); reject(new Error(`"${selector}" nicht gefunden`)); }, timeout);
        });
    }

    function getCsrfToken() {
        return document.querySelector('input[name="_csrf"]')?.value || null;
    }

    function collectFormData(includeAdId = false) {
        const form = document.querySelector('form');
        if (!form) return null;

        const data = new FormData();
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (!input.name) return;
            if (input.name === 'adId' && !includeAdId) return;
            if (input.type === 'radio' && !input.checked) return;
            if (input.type === 'checkbox' && !input.checked) return;
            data.append(input.name, input.value);
        });

        return data;
    }

    async function submitListing(includeAdId = false) {
        const csrfToken = getCsrfToken();
        if (!csrfToken) throw new Error('CSRF-Token nicht gefunden');

        const formData = collectFormData(includeAdId);
        if (!formData) throw new Error('Formular nicht gefunden');

        formData.set('_csrf', csrfToken);

        const response = await fetch('https://www.kleinanzeigen.de/_actions/postListingWeb.submitListing/', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Submit fehlgeschlagen: ${response.status} — ${text.substring(0, 200)}`);
        }

        return await response.text();
    }

    async function deleteAd(adId) {
        const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
        const bearerToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

        if (bearerToken) {
            const response = await fetch(`https://gateway.kleinanzeigen.de/ad-service/ads/${adId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${bearerToken}`,
                },
            });
            return response.ok || response.status === 204;
        }

        // Fallback: alte API
        const csrfToken = getCsrfToken();
        const response = await fetch(`https://www.kleinanzeigen.de/m-anzeigen-loeschen.json?ids=${adId}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                accept: 'application/json',
                ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
            },
        });
        return response.ok;
    }

    function parseRedirectUrl(responseText) {
        try {
            const match = responseText.match(/https:\/\/www\.kleinanzeigen\.de\/[^"\\]+/);
            if (match) return match[0];
        } catch {}
        return 'https://www.kleinanzeigen.de/m-meine-anzeigen.html';
    }

    function showLoading(text = 'Bitte warten...') {
        document.getElementById('kaz-dup-overlay')?.remove();
        document.getElementById('kaz-dup-style')?.remove();
        const style = document.createElement('style');
        style.id = 'kaz-dup-style';
        style.textContent = '@keyframes kaz-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        const overlay = document.createElement('div');
        overlay.id = 'kaz-dup-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', zIndex: '99999',
            backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '16px',
        });
        const spinner = document.createElement('div');
        Object.assign(spinner.style, {
            width: '48px', height: '48px', borderRadius: '50%',
            border: '5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
            animation: 'kaz-spin 0.8s linear infinite',
        });
        const label = document.createElement('div');
        Object.assign(label.style, {
            color: '#fff', fontSize: '16px', fontWeight: '600',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        });
        label.textContent = text;
        overlay.appendChild(spinner);
        overlay.appendChild(label);
        document.body.appendChild(overlay);
    }

    function hideLoading() {
        document.getElementById('kaz-dup-overlay')?.remove();
    }

    function createButton(id, text, clickHandler) {
        const btn = document.createElement('button');
        btn.id = id;
        btn.type = 'button';
        btn.textContent = text;
        btn.className = [
            'inline-flex', 'items-center', 'justify-center', 'gap-xsmall',
            'text-bodyRegularStrong', 'box-border', 'rounded-full', 'cursor-pointer',
            'whitespace-nowrap', 'no-underline', 'hover:no-underline', 'focus:outline-none',
            'h-[44px]', 'min-h-[44px]', 'min-w-[44px]', 'w-fit', 'px-medium',
            'border-2', 'border-solid', 'border-utility', 'text-interactive', 'bg-transparent',
            'hover:border-secondary', 'hover:bg-secondaryContainer', 'hover:text-onSecondaryContainer',
        ].join(' ');
        btn.addEventListener('click', clickHandler);
        return btn;
    }

    async function init() {
        let saveButton;
        try {
            saveButton = await waitForElement('button.bg-primary');
        } catch (e) {
            console.error('[Duplikat-Script] Speichern-Button nicht gefunden:', e.message);
            return;
        }

        if (document.getElementById('kaz-btn-duplicate')) return;

        const duplicateBtn = createButton('kaz-btn-duplicate', '📋 Duplizieren', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            showLoading('Anzeige wird dupliziert...');
            try {
                const result = await submitListing(false);
                const url = parseRedirectUrl(result);
                showLoading('Erfolgreich! Weiterleitung...');
                setTimeout(() => { window.location.href = url; }, 1500);
            } catch (err) {
                hideLoading();
                alert('Fehler beim Duplizieren:\n' + err.message);
                console.error('[Duplikat-Script]', err);
            }
        });

        const reinstateBtn = createButton('kaz-btn-reinstate', '🔄 Neu einstellen', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const adIdInput = document.querySelector('input[name="adId"]');
            const adId = adIdInput?.value || new URLSearchParams(window.location.search).get('adId');
            if (!adId) { alert('Ad-ID nicht gefunden.'); return; }
            if (!confirm(`Anzeige #${adId} wird gelöscht und neu eingestellt.\nFortfahren?`)) return;

            showLoading('Alte Anzeige wird gelöscht...');
            try {
                const deleted = await deleteAd(adId);
                if (!deleted) throw new Error('Löschen fehlgeschlagen (HTTP-Fehler)');
                showLoading('Wird neu eingestellt...');
                await new Promise(r => setTimeout(r, 2000));
                const result = await submitListing(false);
                const url = parseRedirectUrl(result);
                showLoading('Erfolgreich! Weiterleitung...');
                setTimeout(() => { window.location.href = url; }, 1500);
            } catch (err) {
                hideLoading();
                alert('Fehler:\n' + err.message);
                console.error('[Duplikat-Script]', err);
            }
        });

        saveButton.parentElement.appendChild(duplicateBtn);
        saveButton.parentElement.appendChild(reinstateBtn);
        console.log('[Duplikat-Script] v3.1 Buttons erfolgreich eingefügt ✓');
    }

    init();
})();
