(function () {
  'use strict';
  const form = document.querySelector('[data-diagnostic-form]');
  const source = document.getElementById('diagnostic-data');
  if (!form || !source || !window.GarabideDiagnostic) return;
  const config = JSON.parse(source.textContent);
  const c = config.copy;
  const questions = config.questions;
  const fields = [...form.querySelectorAll('fieldset')];
  const progress = document.querySelector('.diagnostic-progress');
  const label = document.querySelector('[data-progress-label]');
  const meter = progress.querySelector('progress');
  const controls = form.querySelector('.diagnostic-controls');
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const error = form.querySelector('.diagnostic-error');
  const result = document.querySelector('.diagnostic-result');
  let current = 0;
  let latestSummary = '';
  let generatedMessage = '';
  const answers = () => questions.map(q => {
    const input = form.querySelector('input[name="' + q.id + '"]:checked');
    return input ? Number(input.value) : null;
  });
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, action, className = 'text-link') {
    const node = el('button', className, text); node.type = 'button'; node.addEventListener('click', action); return node;
  }
  function showQuestion(index, focus) {
    current = index;
    fields.forEach((field, n) => { field.hidden = n !== index; field.disabled = n !== index; });
    form.hidden = false; result.hidden = true; progress.hidden = false;
    back.hidden = index === 0;
    label.textContent = c.progress.replace('{n}', index + 1);
    meter.value = answers().filter(a => a !== null).length;
    meter.setAttribute('aria-valuetext', c.answered.replace('{n}', meter.value));
    next.textContent = index === 9 ? c.finish : c.next;
    error.hidden = true;
    if (focus) { const legend = fields[index].querySelector('legend'); legend.tabIndex = -1; legend.focus({ preventScroll: true }); fields[index].scrollIntoView({ block: 'center', behavior: 'auto' }); }
  }
  function renderResult() {
    const selected = answers();
    const firstMissing = selected.indexOf(null);
    if (firstMissing !== -1) { showQuestion(firstMissing, true); error.textContent = c.incomplete; error.hidden = false; return; }
    const report = window.GarabideDiagnostic.assess(questions, selected);
    result.replaceChildren();
    result.append(el('p', 'eyebrow', c.badge), el('h2', '', c.results), el('p', 'body-large', report.max === 0 ? c.none : report.max === 1 ? c.small : c.several));
    if (report.max > 0) result.append(el('p', '', c.resultsIntro));
    if (report.leaders.length > 1) result.append(el('p', 'diagnostic-tie', c.tied));
    const cards = el('div', 'diagnostic-result-cards');
    report.leaders.forEach(area => {
      const content = config.groups.find(g => g.id === area.id);
      const card = el('article', 'diagnostic-result-card');
      card.append(el('p', 'diagnostic-priority', c.levels[area.score] + ' · ' + area.score + '/4'), el('h3', '', content.title), el('h4', '', c.evidence));
      const evidence = el('ul');
      area.evidence.forEach(item => evidence.append(el('li', '', questions[item.index].text + ' — ' + questions[item.index].answers[item.value])));
      card.append(evidence, el('h4', '', c.idea), el('p', '', content.solution));
      const ideas = el('ul', 'diagnostic-ideas');
      content.ideas.forEach(idea => ideas.append(el('li', '', idea)));
      card.append(ideas, el('h4', '', c.discovery), el('p', '', content.discovery));
      const link = el('a', 'text-link', content.linkText); link.href = content.link; card.append(link); cards.append(card);
    });
    result.append(cards);
    const overview = el('div', 'diagnostic-scoreboard');
    report.ranked.forEach(area => {
      const content = config.groups.find(g => g.id === area.id);
      const row = el('div', 'diagnostic-score-row');
      row.append(el('span', '', content.title), el('span', '', c.levels[area.score] + ' · ' + area.score + '/4'));
      overview.append(row);
    });
    result.append(overview);
    latestSummary = c.summary + report.ranked.filter(area => area.score > 0).map(area => {
      const content = config.groups.find(g => g.id === area.id);
      return '- ' + content.title + ': ' + area.score + '/4.\n' + area.evidence.map(item => '  ' + questions[item.index].text + ' ' + questions[item.index].answers[item.value]).join('\n');
    }).join('\n') + (report.max === 0 ? c.none : '') + '\n' + c.summaryEnd;
    const actions = el('div', 'diagnostic-result-actions');
    actions.append(button(c.contact, () => {
      const message = document.getElementById('mensaje');
      // Preserve a visitor's own draft. Nothing is stored or sent by this action.
      if (!message.value.trim() || message.value === generatedMessage) { message.value = latestSummary; generatedMessage = latestSummary; }
      message.focus({ preventScroll: true }); document.getElementById('contacto').scrollIntoView({ block: 'start', behavior: 'auto' });
    }, 'button'), button(c.edit, () => showQuestion(0, true)), button(c.restart, () => {
      form.reset();
      const message = document.getElementById('mensaje');
      if (message.value === generatedMessage) message.value = '';
      generatedMessage = ''; latestSummary = ''; showQuestion(0, true);
    }));
    result.append(actions, el('p', 'diagnostic-small', c.contactNote));
    form.hidden = true; progress.hidden = true; result.hidden = false;
    result.focus({ preventScroll: true }); result.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  form.noValidate = true;
  controls.hidden = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (answers()[current] === null) { error.textContent = c.error; error.hidden = false; fields[current].querySelector('input').focus(); return; }
    if (current < 9) showQuestion(current + 1, true); else renderResult();
  });
  form.addEventListener('change', () => { error.hidden = true; meter.value = answers().filter(a => a !== null).length; meter.setAttribute('aria-valuetext', c.answered.replace('{n}', meter.value)); });
  back.addEventListener('click', () => showQuestion(Math.max(0, current - 1), true));
  showQuestion(0, false);
})();
