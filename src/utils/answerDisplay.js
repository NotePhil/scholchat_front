const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Text to show for a stored answer. Choice questions (QCM / VRAI_FAUX) may hold
 * the choice id (older submissions): it is resolved to the choice text, and a
 * technical id that no longer matches any choice is never shown as-is.
 */
export const answerDisplayText = (question, raw) => {
  const value = raw == null ? "" : String(raw);
  if (!value) return "";
  const choice = (question?.choixReponses || []).find((c) => c.id === value);
  if (choice?.texte) return choice.texte;
  return UUID_RE.test(value.trim()) ? "—" : value;
};

/**
 * Expected answer of a question for the grading screens: the correct choice(s); for gap-fill /
 * ordering / matching questions (no "correct" flag) every expected item in order; else the model answer.
 */
export const expectedAnswerText = (question) => {
  const choices = [...(question?.choixReponses || [])]
    .sort((a, b) => (a.ordreAffichage ?? 0) - (b.ordreAffichage ?? 0))
    .filter((c) => c.texte && String(c.texte).trim());
  const correct = choices.filter((c) => c.estCorrect);
  if (correct.length > 0) return correct.map((c) => c.texte).join(" / ");
  if (
    choices.length > 0 &&
    ["TROU", "CLASSEMENT", "ASSOCIATION"].includes(question?.typeQuestion)
  ) {
    return choices
      .map((c) => c.texte)
      .join(question.typeQuestion === "CLASSEMENT" ? " → " : ", ");
  }
  return question?.reponse && String(question.reponse).trim()
    ? question.reponse
    : null;
};
