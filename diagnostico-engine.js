/* Orientation based on self-reported friction, not a prediction of savings. */
(function (root) {
  'use strict';
  function assess(questions, answers) {
    if (!Array.isArray(questions) || questions.length !== 10 || !Array.isArray(answers) || answers.length !== 10 || Array.from(answers).some(a => !Number.isInteger(a) || a < 0 || a > 2)) {
      throw new TypeError('Ten complete answers, each 0, 1 or 2, are required.');
    }
    const scores = new Map();
    questions.forEach((question, index) => {
      if (!question.group || !question.id) throw new TypeError('Invalid question.');
      if (!scores.has(question.group)) scores.set(question.group, { id: question.group, score: 0, count: 0, evidence: [] });
      const area = scores.get(question.group);
      area.count++; area.score += answers[index];
      if (answers[index] > 0) area.evidence.push({ index, value: answers[index] });
    });
    if (scores.size !== 5 || [...scores.values()].some(area => area.count !== 2)) throw new TypeError('Five areas with two questions each are required.');
    const ranked = [...scores.values()].sort((a, b) => b.score - a.score);
    const max = ranked[0].score;
    // All tied leaders are shown; a tie never silently favours a product.
    const leaders = ranked.filter(area => area.score === max && area.score > 0);
    return { ranked, leaders, max, total: ranked.reduce((sum, area) => sum + area.score, 0) };
  }
  root.GarabideDiagnostic = { assess };
  if (typeof module === 'object' && module.exports) module.exports = { assess };
})(typeof globalThis !== 'undefined' ? globalThis : this);
