'use strict';
(() => {
  const form = document.getElementById('trial-application-form');
  const status = document.getElementById('form-status');
  const submit = form.querySelector('[type="submit"]');
  const dateSelect = document.getElementById('preferred-date');
  const preview = document.body.dataset.mode === 'preview';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inFlight = false;
  let finished = false;

  // Keep the event names and payloads used on the existing public LP.
  function sendSeisyunEvent(eventName, parameters) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, parameters));
  }
  const query = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(name => {
    form.elements.namedItem(name).value = query.get(name) || '';
  });

  // Past sessions remain readable but cannot be selected as future visits.
  function updatePastDates() {
    const now = Date.now();
    document.querySelectorAll('[data-date]').forEach(item => {
      if (now > Date.parse(item.dataset.date + 'T14:30:00+09:00')) {
        if (item.tagName === 'OPTION') {
          if (item.selected) dateSelect.value = '';
          item.disabled = true;
          if (!item.textContent.endsWith('（開催済み）')) item.textContent += '（開催済み）';
        } else {
          item.setAttribute('aria-disabled', 'true');
          item.removeAttribute('href');
          item.removeAttribute('data-pick-date');
          item.querySelector('.date-action').textContent = '開催済み';
        }
      }
    });
  }
  updatePastDates();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updatePastDates(); });
  dateSelect.addEventListener('focus', updatePastDates);

  document.addEventListener('click', event => {
    const dateButton = event.target.closest('[data-pick-date]');
    if (dateButton) {
      updatePastDates();
      if (dateButton.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
      dateSelect.value = dateButton.dataset.pickDate;
      dateSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const formButton = event.target.closest('.js-form-open');
    if (formButton && formButton.getAttribute('aria-disabled') !== 'true') {
      sendSeisyunEvent('seisyun_form_open', { cta_location: formButton.dataset.label || 'unknown' });
    } else {
      const phoneButton = event.target.closest('a.js-track[href^="tel:"]');
      if (phoneButton) sendSeisyunEvent('seisyun_phone_click', {
        cta_location: phoneButton.dataset.label || 'unknown', link_type: 'phone'
      });
    }
  });

  const videoButton = document.getElementById('play-video');
  videoButton.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/WBuT2JIN__A?rel=0&playsinline=1&autoplay=1';
    iframe.title = 'ヤマハ青春ポップス 紹介動画';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    document.getElementById('film-frame').replaceChildren(iframe);
    iframe.focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (inFlight || finished) return;
    updatePastDates();
    if (!form.reportValidity()) return;
    if (preview) {
      status.className = 'form-status is-preview';
      status.textContent = '確認用プレビューのため送信していません。入力・日程選択の操作をお試しいただけます。';
      status.focus({ preventScroll: true });
      return;
    }
    inFlight = true;
    submit.disabled = true;
    submit.textContent = '送信中です…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = '';
    status.className = 'form-status';
    sendSeisyunEvent('seisyun_form_attempt', { form_id: 'trial-application-form' });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    let confirmedRejection = false;
    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      confirmedRejection = !response.ok;
      // Preserve the published LP's provider contract: any successful HTTP response.
      // Provider storage and notification still require separate operational verification.
      if (!response.ok) {
        confirmedRejection = true;
        throw new Error('Formspree rejected the submission');
      }
      finished = true;
      sendSeisyunEvent('seisyun_form_success', { form_id: 'trial-application-form' });
      // Retain attribution fields; do not reset UTM values after acceptance.
      status.className = 'form-status is-success';
      status.textContent = '送信できました。担当者からご連絡し、体験・見学日時を確認します。予約・入会はまだ確定していません。';
      submit.textContent = '送信済み';
    } catch (error) {
      sendSeisyunEvent('seisyun_form_error', { form_id: 'trial-application-form' });
      status.className = 'form-status is-error';
      if (confirmedRejection) {
        status.textContent = '送信できませんでした。時間をおいて再度お試しいただくか、0740-22-2063へお電話ください。';
        submit.disabled = false;
        submit.textContent = 'もう一度送信する';
      } else {
        finished = true;
        status.textContent = '通信が途切れ、受付状況を確認できませんでした。重複した申込みを避けるため、再送信の前に0740-22-2063へお電話ください。';
        submit.textContent = '電話で受付状況をご確認ください';
      }
    } finally {
      clearTimeout(timer);
      inFlight = false;
      form.removeAttribute('aria-busy');
      status.focus({ preventScroll: true });
    }
  });

  // Only decorate off-screen content; the cover, information and form are usable immediately.
  let revealObserver;
  function enableReveals() {
    if (motionPreference.matches || !('IntersectionObserver' in window)) return;
    document.querySelectorAll('.reveal').forEach(item => {
      if (item.getBoundingClientRect().top < window.innerHeight + 60) item.classList.add('is-visible');
    });
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }), { rootMargin: '0px 0px 60px 0px', threshold: 0.02 });
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(item => revealObserver.observe(item));
    document.documentElement.classList.add('motion-ready');
  }
  enableReveals();
  const sticky = document.querySelector('.sticky-cta');
  const progress = document.querySelector('.reading-progress');
  const ribbon = document.querySelector('[data-drift]');
  let scheduled = false;
  function paintScroll() {
    scheduled = false;
    const formRect = document.getElementById('seisyun-form').getBoundingClientRect();
    const heroBottom = document.querySelector('.hero').getBoundingClientRect().bottom;
    const formVisible = formRect.top < window.innerHeight * .85 && formRect.bottom > 80;
    const atFooter = document.querySelector('.footer').getBoundingClientRect().top < window.innerHeight;
    sticky.classList.toggle('is-visible', heroBottom < 120 && !formVisible && !atFooter);
    if (motionPreference.matches) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (total > 0 ? Math.max(0, Math.min(1, window.scrollY / total)) : 0) + ')';
    const rect = ribbon.parentElement.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      // Scroll-linked horizontal drift, no continuous loop and no scroll hijacking.
      const drift = Math.max(-130, Math.min(0, (rect.top - window.innerHeight) * .09));
      ribbon.style.setProperty('--drift', drift + 'px');
    }
  }
  function requestPaint() { if (!scheduled) { scheduled = true; requestAnimationFrame(paintScroll); } }
  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', requestPaint);
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      revealObserver?.disconnect();
      document.documentElement.classList.remove('motion-ready');
      ribbon.style.removeProperty('--drift');
    } else enableReveals();
    requestPaint();
  });
  paintScroll();
})();
