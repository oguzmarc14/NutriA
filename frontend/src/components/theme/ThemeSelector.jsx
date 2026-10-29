import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';

const choices = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
];

export default function ThemeSelector() {
  const { preference, setPreference } = useTheme();
  return (
    <div className="nutria-theme-picker mx-1 my-2 rounded-xl p-2">
      <p className="mb-2 text-xs font-bold">Apariencia</p>
      <div className="grid grid-cols-3 gap-1" role="group" aria-label="Tema de NutriA">
        {choices.map(({ value, label, Icon }) => (
          <button key={value} type="button" aria-pressed={preference === value}
            onClick={() => setPreference(value)}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-bold ${preference === value ? 'nutria-theme-selected' : 'nutria-theme-option'}`}>
            <Icon size={17} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}
