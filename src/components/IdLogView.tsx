import React, { useState } from 'react';
import { useSound } from '../contexts/SoundContext';
import { IdLogEntry, IdLogRifle } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslatedShortExplanation } from '../data/shortExplanationsTranslations';
import { QUESTIONS_BANK } from '../questionsBank';
import { translateQuestionText, getQuestionDisplay } from '../utils/translateQuestion';
import { getTranslatedDetailedExplanation } from '../data/detailedExplanationsTranslations';
import { getDetailedExplanationForLevel, type DetailedExplanationLevel } from '../utils/detailedExplanationLevel';
import { splitQuestion } from '../utils/splitQuestion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const formatCodeSnippet = (text: string): string => {
  if (!text) return '';

  const isSimpleExpression = !text.includes('\n') &&
    !/\b(def|class|if|for|while|with|try|except|finally|else|elif)\b/.test(text);

  if (isSimpleExpression) return text;
  if (text.includes('\n')) return text;

  let inString: string | null = null;
  let bracketDepth = 0;
  let currentLine = '';
  const initialLines: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!inString && (char === "'" || char === '"')) {
      inString = char;
      currentLine += char;
    } else if (inString === char && text[i - 1] !== '\\') {
      inString = null;
      currentLine += char;
    } else if (!inString && (char === '[' || char === '(' || char === '{')) {
      bracketDepth++;
      currentLine += char;
    } else if (!inString && (char === ']' || char === ')' || char === '}')) {
      bracketDepth--;
      currentLine += char;
    } else if (!inString && bracketDepth === 0 && char === ':') {
      currentLine += char;
      initialLines.push(currentLine.trim());
      currentLine = '';
    } else if (!inString && bracketDepth === 0 && char === ';') {
      if (currentLine.trim()) initialLines.push(currentLine.trim());
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) initialLines.push(currentLine.trim());

  let currentIndent = 0;
  const formattedLines: string[] = [];

  for (let i = 0; i < initialLines.length; i++) {
    let line = initialLines[i];
    if (/^(else|elif|except|finally)\b/.test(line)) {
      currentIndent = Math.max(0, currentIndent - 1);
    }
    if (currentIndent > 0) {
      if (/^(print|assert|obj\s*=|f\s*=|x\s*=|y\s*=|g\s*=|next\([^)]*\)|[a-z_]\w*\s*=\s*[A-Z])/.test(line) && !line.startsWith('self.')) {
        currentIndent = 0;
      }
      if (/^(class|import|from)\b/.test(line)) currentIndent = 0;
      if (line.match(/^[a-z_]\w*\(/) && !line.startsWith('self.')) {
        const funcName = line.split('(')[0];
        if (!initialLines.slice(0, i).some(l => l.includes('def ' + funcName))) {
          currentIndent = 0;
        }
      }
    }
    formattedLines.push(' '.repeat(currentIndent * 4) + line);
    if (line.endsWith(':')) {
      currentIndent++;
    } else if (/^(return|pass|break|continue)\b/.test(line)) {
      currentIndent = Math.max(0, currentIndent - 1);
    }
  }
  return formattedLines.join('\n');
};

const splitQuestionForDisplay = (text: string, lang: string) =>
  splitQuestion(text, lang, translateQuestionText);

const rifleDisplayLabel = (r: IdLogRifle): string =>
  r.userName ? `${r.userName} — ${r.name}` : r.name;

interface IdLogViewProps {
  entries: IdLogEntry[];
  rifles: IdLogRifle[];
  onClose: () => void;
  onAddRifle: (name: string, userName?: string) => void;
  onRemoveRifle: (rifleId: string) => void;
  onRenameRifle: (rifleId: string, name: string) => void;
  onSetRifleUserName: (rifleId: string, userName: string) => void;
  onSetEntryRifle: (entryId: number, entryTimestamp: number, rifleId: string | undefined) => void;
}

export const IdLogView: React.FC<IdLogViewProps> = ({
  entries,
  rifles,
  onClose,
  onAddRifle,
  onRemoveRifle,
  onRenameRifle,
  onSetRifleUserName,
  onSetEntryRifle,
}) => {
  const { t, language } = useLanguage();
  const { playTapSound } = useSound();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [newRifleName, setNewRifleName] = useState('');
  const [newRifleUserName, setNewRifleUserName] = useState('');
  const [editingRifleId, setEditingRifleId] = useState<string | null>(null);
  const [editingRifleName, setEditingRifleName] = useState('');
  const [editingRifleUserName, setEditingRifleUserName] = useState('');
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  const handleAddRifle = () => {
    const name = newRifleName.trim();
    if (name) {
      playTapSound();
      onAddRifle(name, newRifleUserName.trim() || undefined);
      setNewRifleName('');
      setNewRifleUserName('');
    }
  };

  const startEditRifle = (r: IdLogRifle) => {
    setEditingRifleId(r.id);
    setEditingRifleName(r.name);
    setEditingRifleUserName(r.userName ?? '');
  };

  const saveEditRifle = () => {
    if (editingRifleId) {
      playTapSound();
      onRenameRifle(editingRifleId, editingRifleName);
      onSetRifleUserName(editingRifleId, editingRifleUserName);
      setEditingRifleId(null);
      setEditingRifleName('');
      setEditingRifleUserName('');
    }
  };

  const toggleCodonExplanation = (entryKey: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryKey)) {
        newSet.delete(entryKey);
      } else {
        newSet.add(entryKey);
      }
      return newSet;
    });
  };

  const [detailedExplanationLevel, setDetailedExplanationLevel] = useState<DetailedExplanationLevel>('intermediate');

  const getQuestionDetailedExplanation = (id: number): string | null => {
    const question = QUESTIONS_BANK.find(q => q.id === id);
    if (!question?.detailedExplanation) return null;
    return getDetailedExplanationForLevel(question, detailedExplanationLevel) ?? null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in duration-300 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <i className="fas fa-list text-emerald-400"></i> {t('idSearch.idLog')}
          </h2>
          <button
            onClick={() => { playTapSound(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* My rifles: register and name rifles */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <i className="fas fa-person-military-rifle text-amber-400"></i>
            {t('idLog.myRifles')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {rifles.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 border border-white/10 px-2.5 py-1.5"
              >
                {editingRifleId === r.id ? (
                  <>
                    <input
                      type="text"
                      value={editingRifleUserName}
                      onChange={(e) => setEditingRifleUserName(e.target.value)}
                      placeholder={t('idLog.userNamePlaceholder')}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveEditRifle(); if (e.key === 'Escape') { setEditingRifleId(null); setEditingRifleName(''); setEditingRifleUserName(''); } }}
                      className="bg-slate-900 border border-white/20 rounded px-2 py-0.5 text-sm text-white w-24"
                      onClick={(e) => e.stopPropagation()}
                      title={t('idLog.userName')}
                    />
                    <input
                      type="text"
                      value={editingRifleName}
                      onChange={(e) => setEditingRifleName(e.target.value)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveEditRifle(); if (e.key === 'Escape') { setEditingRifleId(null); setEditingRifleName(''); setEditingRifleUserName(''); } }}
                      className="bg-slate-900 border border-white/20 rounded px-2 py-0.5 text-sm text-white w-32"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); saveEditRifle(); }} className="text-emerald-400 hover:text-emerald-300 text-xs">✓</button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-200">{rifleDisplayLabel(r)}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); playTapSound(); startEditRifle(r); }} className="text-slate-500 hover:text-amber-400 text-xs" title={t('idLog.editRifle')}><i className="fas fa-pen"></i></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); playTapSound(); onRemoveRifle(r.id); }} className="text-slate-500 hover:text-red-400 text-xs" title={t('idLog.deleteRifle')}><i className="fas fa-trash-can"></i></button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newRifleUserName}
                onChange={(e) => setNewRifleUserName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRifle(); }}
                placeholder={t('idLog.userNamePlaceholder')}
                className="w-32 rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
              <input
                type="text"
                value={newRifleName}
                onChange={(e) => setNewRifleName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRifle(); }}
                placeholder={t('idLog.rifleNamePlaceholder')}
                className="flex-1 rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
            </div>
            <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => { playTapSound(); handleAddRifle(); }}
              className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-3 py-2 text-sm font-medium hover:bg-emerald-500/30"
            >
              {t('idLog.addRifle')}
            </button>
          </div>
          </div>
        </div>

        {sortedEntries.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500 text-2xl">
              <i className="fas fa-bookmark"></i>
            </div>
            <p className="text-slate-500 font-medium">{t('idSearch.noSavedQuestions')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedEntries.map((entry) => {
              const entryKey = `${entry.id}-${entry.timestamp}`;
              const isExpanded = expandedEntries.has(entryKey);
              const bankQuestion = QUESTIONS_BANK.find((q) => q.id === entry.id);
              const translated = bankQuestion
                ? getQuestionDisplay(language, entry.question, bankQuestion.options)
                : { question: translateQuestionText(entry.question, language), options: [] as string[] };
              const displayQuestion = translated.question;
              const displayCorrectAnswer =
                bankQuestion && translated.options.length
                  ? translated.options[bankQuestion.options.indexOf(entry.correctAnswer)] ?? entry.correctAnswer
                  : entry.correctAnswer;
              const shortExplanation = getTranslatedShortExplanation(entry.id, entry.explanation, language);
              const detailedExplanation = getQuestionDetailedExplanation(entry.id);
              const shortExplanationLooksLikeCode = /\b(def|print|for|if|while|class|import|from)\b/.test(shortExplanation);
              return (
              <div
                key={entryKey}
                className="glass rounded-2xl p-5 border-l-4 border-l-emerald-500 transition-all hover:translate-x-1 cursor-pointer"
                onClick={() => { playTapSound(); toggleCodonExplanation(entryKey); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playTapSound();
                    toggleCodonExplanation(entryKey);
                  }
                }}
                role="button"
                tabIndex={0}
                title={t('idLog.clickToViewCodon')}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-2 group">
                      ID: {entry.id}
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[8px] transition-transform group-hover:scale-110`}></i>
                    </span>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-500" onClick={(e) => e.stopPropagation()}>
                      <span>{t('idLog.assignRifle')}:</span>
                      <select
                        value={entry.rifleId ?? ''}
                        onChange={(e) => {
                          playTapSound();
                          const v = e.target.value;
                          onSetEntryRifle(entry.id, entry.timestamp, v ? v : undefined);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-800 border border-white/20 rounded px-2 py-0.5 text-slate-300 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">{t('idLog.noRifle')}</option>
                        {rifles.map((r) => (
                          <option key={r.id} value={r.id}>{rifleDisplayLabel(r)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="max-h-[45vh] overflow-y-auto overflow-x-hidden bg-slate-800 rounded-lg">
                    {(() => {
                      const { prefix, code } = splitQuestionForDisplay(displayQuestion, language);
                      const displayText = displayQuestion;
                      if (code) {
                        return (
                          <div className="flex flex-col">
                            {prefix && (
                              <div className="px-4 pt-4 pb-2 border-b border-slate-700/50">
                                <p className="text-white text-lg font-medium leading-relaxed">{prefix}</p>
                              </div>
                            )}
                            <div className="overflow-x-auto flex-1">
                              <SyntaxHighlighter
                                language="bash"
                                style={oneDark}
                                customStyle={{
                                  padding: '1rem',
                                  margin: 0,
                                  background: 'transparent',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.75',
                                  fontFamily: "'Fira Code', monospace"
                                }}
                                codeTagProps={{
                                  style: {
                                    fontFamily: "'Fira Code', monospace",
                                    whiteSpace: 'pre',
                                    display: 'block'
                                  }
                                }}
                                PreTag="div"
                              >
                                {formatCodeSnippet(code)}
                              </SyntaxHighlighter>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <h3 className="text-xl font-bold leading-tight text-white px-4 pt-4 pb-4">
                          {displayText}
                        </h3>
                      );
                    })()}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center gap-2">
                    <i className="fas fa-check-circle"></i>
                    <span>{t('quiz.correctAnswer')}: {displayCorrectAnswer}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-white/5 space-y-4 animate-in slide-in-from-top duration-200">
                    <div className="p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <i className="fas fa-lightbulb text-emerald-400 text-sm"></i>
                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-400">{t('idLog.codonExplanation')}</h4>
                      </div>
                      {shortExplanationLooksLikeCode ? (
                        <div className="overflow-x-auto bg-slate-900 rounded-lg">
                          <SyntaxHighlighter
                            language="bash"
                            style={oneDark}
                            customStyle={{
                              padding: '1rem',
                              margin: 0,
                              background: 'transparent',
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                              fontFamily: "'Fira Code', monospace"
                            }}
                            codeTagProps={{
                              style: {
                                fontFamily: "'Fira Code', monospace",
                                whiteSpace: 'pre',
                                display: 'block'
                              }
                            }}
                            PreTag="div"
                          >
                            {formatCodeSnippet(shortExplanation)}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                          {shortExplanation}
                        </p>
                      )}
                    </div>

                    {detailedExplanation && (
                      <div className="p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <i className="fas fa-graduation-cap text-xs"></i>
                              {t('glossary.inDepthDescription')}
                            </h5>
                            <label className="flex items-center gap-1.5 text-[10px] text-slate-500 ml-auto">
                              <span>{t('idSearch.explanationLevel')}:</span>
                              <select
                                value={detailedExplanationLevel}
                                onChange={(e) => setDetailedExplanationLevel(e.target.value as DetailedExplanationLevel)}
                                className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-300 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="beginner">{t('subLevels.beginner')}</option>
                                <option value="intermediate">{t('subLevels.intermediate')}</option>
                                <option value="expert">{t('subLevels.expert')}</option>
                              </select>
                            </label>
                          </div>
                          <div className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">
                            {getTranslatedDetailedExplanation(
                              entry.id,
                              detailedExplanation,
                              language,
                              detailedExplanationLevel,
                              bankQuestion?.question ?? entry.question,
                              bankQuestion ? bankQuestion.options[bankQuestion.correct_option_index] : entry.correctAnswer
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};
