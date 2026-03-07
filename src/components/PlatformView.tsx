import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';

interface PlatformDiff {
  command: string;
  linux: string;
  macos: string;
  notes?: string;
}

const PLATFORM_DIFFS: PlatformDiff[] = [
  {
    command: 'awk -i inplace',
    linux: 'awk -i inplace "{print}" file   # GNU awk 4.1+',
    macos: "awk '{print}' file > tmp && mv tmp file   # no -i",
    notes: 'BSD awk lacks -i inplace. Use temp file.'
  },
  {
    command: 'cp --reflink',
    linux: 'cp --reflink=auto src dst   # copy-on-write when possible',
    macos: 'cp -c src dst   # -c for clone (reflink) on APFS',
    notes: 'Linux: --reflink. macOS: -c for clone on APFS.'
  },
  {
    command: 'date (relative)',
    linux: 'date -d "yesterday"   date -d "+12 hours"',
    macos: 'date -v-1d   date -v+12H',
    notes: 'GNU: -d. BSD: -v with y/m/w/d/H/M/S. Install coreutils for gdate on macOS.'
  },
  {
    command: 'expr vs $(( ))',
    linux: 'expr 1 + 1   or   echo $((1 + 1))',
    macos: 'Same; $(( )) preferred for arithmetic.',
    notes: '$(( )) is POSIX and works everywhere.'
  },
  {
    command: 'find -delete',
    linux: 'find . -name "*.bak" -delete',
    macos: 'find . -name "*.bak" -delete   # works on both',
    notes: '-delete is POSIX; generally works on both.'
  },
  {
    command: 'find -printf',
    linux: 'find . -maxdepth 1 -printf "%P\\n"',
    macos: 'find . -maxdepth 1 | xargs -I {} basename {}   # -printf not available',
    notes: 'macOS find lacks -printf. Use xargs basename or a loop.'
  },
  {
    command: 'grep -P',
    linux: 'grep -P "\\d+" file   # Perl regex',
    macos: 'grep -E "[0-9]+" file   # -P not available; brew install grep for ggrep',
    notes: 'macOS grep does not support -P. Use -E or install GNU grep.'
  },
  {
    command: 'grep -r (recursive)',
    linux: 'grep -r pattern dir/   # skips binaries by default on some',
    macos: 'grep -r pattern dir/   # similar; -I to skip binaries',
    notes: 'Both support -r. Use -I to skip binary files when needed.'
  },
  {
    command: 'head / tail -n',
    linux: 'head -n 5 file   tail -n 5 file',
    macos: 'head -5 file   tail -5 file   # both accept -n 5',
    notes: 'Both work; -5 is shorthand on macOS.'
  },
  {
    command: 'ls --color',
    linux: 'ls --color=auto   ls -G on some',
    macos: 'ls -G   # BSD ls uses -G for color',
    notes: 'Linux: --color. macOS: -G. Many distros alias ls to ls --color.'
  },
  {
    command: 'md5sum / sha256sum',
    linux: 'md5sum file   sha256sum file',
    macos: 'md5 file   shasum -a 256 file',
    notes: 'macOS uses md5 and shasum; Linux uses md5sum and sha256sum.'
  },
  {
    command: 'mktemp',
    linux: 'mktemp   mktemp -d   mktemp -p /tmp',
    macos: 'mktemp   mktemp -d   # -p not on macOS',
    notes: 'BSD mktemp lacks -p. Use mktemp in desired dir: mktemp /tmp/foo.XXXXXX.'
  },
  {
    command: 'ps (process list)',
    linux: 'ps aux   ps -ef   # different columns',
    macos: 'ps aux   ps -ef   # aux works; -ef shows different format',
    notes: 'Output columns differ. Use ps -o pid,comm,args for portability.'
  },
  {
    command: 'readlink -f',
    linux: 'readlink -f /path   # canonical absolute path',
    macos: 'readlink -f not on macOS. Use: greadlink -f (coreutils) or realpath',
    notes: 'brew install coreutils for greadlink.'
  },
  {
    command: 'realpath',
    linux: 'realpath file   # canonical path',
    macos: 'realpath not default; brew install coreutils or use readlink',
    notes: 'On macOS, use greadlink -f from coreutils.'
  },
  {
    command: 'sed -E (extended regex)',
    linux: 'sed -E "s/(foo|bar)//g"   # -E works',
    macos: "sed -E doesn't fully work; use -e 's/foo//g' -e 's/bar//g' or perl -pe",
    notes: 'BSD sed -E can fail on | + ? \\s \\t. Use multiple -e or perl.'
  },
  {
    command: 'sed -i',
    linux: 'sed -i "s/old/new/" file   # in-place edit (no backup)',
    macos: "sed -i '' 's/old/new/' file   # backup arg required ('' = no backup)",
    notes: 'macOS sed requires a backup extension; use empty string for no backup.'
  },
  {
    command: 'seq',
    linux: 'seq 1 10   seq -w 1 100',
    macos: 'seq 1 10   # -w not on BSD seq',
    notes: 'BSD seq lacks -w (equal width). Use printf or awk.'
  },
  {
    command: 'sort -V (version sort)',
    linux: 'sort -V   # natural/version sort',
    macos: 'sort -V not on BSD; use sort -t. -k1,1n -k2,2n or gsort (coreutils)',
    notes: 'brew install coreutils for gsort -V on macOS.'
  },
  {
    command: 'split --additional-suffix',
    linux: 'split -b 50M log.txt chunk --additional-suffix=.log',
    macos: 'split -b 50m log.txt chunk   # then rename; no --additional-suffix',
    notes: 'BSD split lacks --additional-suffix. Split then rename in a loop.'
  },
  {
    command: 'stat',
    linux: 'stat -c %s file   stat --printf="%s" file',
    macos: 'stat -f %z file   stat -x file   # different format',
    notes: 'GNU stat uses -c/--printf; BSD stat uses -f. Output format differs.'
  },
  {
    command: 'tar (extract)',
    linux: 'tar -xvf archive.tar.gz   # -z implicit on .gz',
    macos: 'tar -xvf archive.tar.gz   # generally same; some flag differences',
    notes: 'Usually compatible. For BSD tar use -x -v -f; GNU allows -xvf.'
  },
  {
    command: 'timeout',
    linux: 'timeout 5 slow_command',
    macos: 'timeout not default; use perl -e "alarm 5; exec @ARGV" or gtimeout (coreutils)',
    notes: 'brew install coreutils for gtimeout on macOS.'
  },
  {
    command: 'touch -d',
    linux: 'touch -d "2020-01-01" file',
    macos: 'touch -t 202001010000 file   # -t format: [[CC]YY]MMDDhhmm[.ss]',
    notes: 'GNU touch -d accepts many formats; BSD touch -t has different format.'
  },
  {
    command: 'uuidgen',
    linux: 'uuidgen   # lowercase output',
    macos: 'uuidgen   # uppercase output',
    notes: 'Same command; output casing differs (Linux lowercase, macOS uppercase).'
  },
  {
    command: 'wc -l',
    linux: 'wc -l file   # counts newlines',
    macos: 'wc -l file   # no trailing newline = may undercount by 1',
    notes: 'If file lacks trailing newline, wc -l may report one fewer line.'
  },
  {
    command: 'which',
    linux: 'which cmd   # often built-in',
    macos: 'which cmd   type cmd   command -v cmd   # command -v is portable',
    notes: 'Prefer command -v for portability in scripts.'
  },
  {
    command: 'xargs -d',
    linux: 'echo -n "a b" | xargs -d " " -I {} echo {}',
    macos: "xargs -d not available. Use: echo 'a b' | xargs -I {} echo {}",
    notes: 'BSD xargs lacks -d. Different input formatting needed.'
  },
  {
    command: 'xargs -r / --no-run-if-empty',
    linux: 'find . -name "*.txt" | xargs -r wc -l',
    macos: 'find . -name "*.txt" | xargs wc -l   # BSD xargs does not run with empty input anyway',
    notes: 'GNU xargs -r avoids running command on empty input; BSD behaves differently.'
  },
  {
    command: 'xargs -I (replacements)',
    linux: 'echo x | xargs -I {} echo a-{} b-{} c-{}   # all replaced',
    macos: 'echo x | xargs -I {} echo a-{} b-{}   # only first 5 args replaced',
    notes: 'BSD xargs -I replaces only first 5 argument occurrences.'
  }
];

export const PlatformView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { playTapSound } = useSound();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="relative min-h-[400px] animate-in slide-in-from-left duration-300 pb-12">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { playTapSound(); onBack(); }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span className="text-sm font-medium">{t('operations.back')}</span>
        </button>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <i className="fas fa-laptop text-sky-400"></i>
          {t('rules.platform')}
        </h2>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        {t('rules.platformDesc')}
      </p>

      <div className="space-y-3">
        {PLATFORM_DIFFS.map((diff, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
          >
            <button
              onClick={() => { playTapSound(); setExpanded(expanded === idx ? null : idx); }}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <code className="text-emerald-400 font-mono text-sm">{diff.command}</code>
              <i className={`fas fa-chevron-${expanded === idx ? 'up' : 'down'} text-slate-500 text-xs`}></i>
            </button>
            {expanded === idx && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Linux</p>
                  <pre className="text-xs text-slate-300 font-mono bg-slate-900/50 p-3 rounded-lg overflow-x-auto">
                    {diff.linux}
                  </pre>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">macOS</p>
                  <pre className="text-xs text-slate-300 font-mono bg-slate-900/50 p-3 rounded-lg overflow-x-auto">
                    {diff.macos}
                  </pre>
                </div>
                {diff.notes && (
                  <p className="text-xs text-slate-500 italic">{diff.notes}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
